"""Contract between the blueprint, the backend, the API, the frontend and the docs.

Reads (never imports or runs) the frontend sources, the API document and the
frozen Batch 1 blueprint, and checks that every copy of the vocabulary and of
the fixed texts is identical, that the documented JSON examples validate
against the real response models, and that the rendered frontend follows the
display rules.
"""

import json
import re
from pathlib import Path

import pytest

from conftest import seed_food
from domain import allergens as A
from domain import nutrition_rules as N
from schemas import (
    AllergenStatusMap,
    AlternativesRequest,
    AlternativesResponse,
    ErrorResponse,
    FoodSchema,
    HealthGoalsResponse,
    MetaAllergensResponse,
    MethodNotAllowed,
)
from services import discovery_engine as E
from test_discovery_api import check_invariants

BACKEND = Path(__file__).resolve().parents[1]
REPO = BACKEND.parent
FRONTEND_SRC = REPO / "frontend" / "src"
SPEC_PART1 = REPO / "docs" / "batch1" / "rev7_part1.md"
SPEC_PART2 = REPO / "docs" / "batch1" / "rev7_part2.md"
API_DOC = REPO / "docs" / "api" / "food-discovery.md"
README = REPO / "README.md"

OLD_STATUS = "may" + "_contain"  # never written literally in code

# Frontend files of the Batch 1 scope (paths relative to frontend/src).
M6 = "utils/api.js"
M7 = "App.jsx"
M8 = "pages/nutrition-explorer-modal/index.jsx"
M9 = "pages/user-registration/components/AllergenProfileForm.jsx"
M10 = "pages/user-registration/index.jsx"
M11 = "pages/food-search-results/index.jsx"
M12 = "pages/food-comparison-tool/index.jsx"
N14 = "constants/allergens.js"
N15 = "constants/nutritionFilters.js"
SCOPE_FRONTEND = (
    M6, M7, M8, M9, M10, M11, M12, N14, N15,
    "utils/allergenStatus.js", "utils/nutrition.js", "utils/allergenProfile.js",
    "context/AllergenProfileContext.jsx",
)
UNRENDERED = (
    "pages/nutrition-explorer-modal/components/AllergenAlert.jsx",
    "pages/nutrition-explorer-modal/components/ComparisonView.jsx",
    "pages/food-search-results/components/ResultCard.jsx",
    "pages/food-search-results/components/ResultsGrid.jsx",
    "pages/food-search-results/components/SearchFilters.jsx",
    "pages/food-comparison-tool/components/AddFoodModal.jsx",
    "pages/food-comparison-tool/components/ComparisonCard.jsx",
    "pages/food-comparison-tool/components/RecommendationPanel.jsx",
    "pages/food-comparison-tool/components/FilterControls.jsx",
)


def read(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def frontend(relative: str) -> str:
    return read(FRONTEND_SRC / relative)


# ═══════════════════════════════════════════════════════════════
# Readers: strict JSON, the fixed-text blocks, the JSON examples
# ═══════════════════════════════════════════════════════════════
def strict_loads(text):
    """JSON parser that rejects NaN, Infinity, -Infinity and duplicate keys."""
    def reject_constant(name):
        raise ValueError(f"non-finite JSON constant: {name}")

    def reject_duplicates(pairs):
        keys = [key for key, _ in pairs]
        if len(keys) != len(set(keys)):
            raise ValueError("duplicate key")
        return dict(pairs)

    return json.loads(text, parse_constant=reject_constant, object_pairs_hook=reject_duplicates)


_FIXED_TEXT = re.compile(r"Fixed text `([^`]+)`[^\n]*\n\n```text\n(.*?)\n```", re.DOTALL)
_EXAMPLE = re.compile(r"Schema: `(\w+)`\n\n```json\n(.*?)\n```", re.DOTALL)


def fixed_texts(markdown: str) -> dict:
    found = {}
    for key, text in _FIXED_TEXT.findall(markdown):
        assert key not in found, f"fixed text defined twice: {key}"
        found[key] = text
    return found


def json_examples(markdown: str) -> list[tuple[str, object]]:
    return [(schema, strict_loads(body)) for schema, body in _EXAMPLE.findall(markdown)]


SPEC_TEXTS = fixed_texts(read(SPEC_PART1))


def test_strict_parser_rejects_bad_json():
    for bad in ('{"a": NaN}', '{"a": Infinity}', '{"a": -Infinity}', '{"a": 1, "a": 2}', '{"a": 1,}'):
        with pytest.raises(ValueError):
            strict_loads(bad)


def test_the_blueprint_defines_21_fixed_texts():
    assert len(SPEC_TEXTS) == 21


# ═══════════════════════════════════════════════════════════════
# A tiny evaluator for the frontend constant files
# ═══════════════════════════════════════════════════════════════
_TOKEN = re.compile(
    r"""\s+|//[^\n]*|/\*.*?\*/"""
    r"""|(?P<str>'(?:[^'\\\n]|\\.)*'|"(?:[^"\\\n]|\\.)*")"""
    r"""|(?P<num>\d+(?:\.\d+)?)"""
    r"""|(?P<id>[A-Za-z_$][\w$]*)"""
    r"""|(?P<p>=>|[{}\[\](),:+;.=])"""
    r"""|(?P<other>.)""",
    re.DOTALL,
)
_ESCAPES = {"n": "\n", "t": "\t", "'": "'", '"': '"', "\\": "\\"}


def _tokens(source: str):
    out = []
    for match in _TOKEN.finditer(source):
        kind = match.lastgroup
        if kind is None:
            continue
        value = match.group(kind)
        if kind == "str":
            value = re.sub(r"\\(.)", lambda m: _ESCAPES.get(m.group(1), m.group(1)), value[1:-1])
        elif kind == "num":
            value = float(value) if "." in value else int(value)
        out.append((kind, value))
    return out


class _Unsupported(Exception):
    pass


def js_constants(source: str) -> dict:
    """Values of `export const NAME = <expr>;` built from literals.

    Supports string, number, array and object literals, `+` between strings,
    `Object.freeze(...)` and references to earlier constants. Any other
    expression is skipped.
    """
    tokens = _tokens(source)
    env: dict = {}
    pos = 0

    def peek(offset=0):
        index = pos + offset
        return tokens[index] if index < len(tokens) else ("eof", None)

    def take(kind=None, value=None):
        nonlocal pos
        token = peek()
        if (kind and token[0] != kind) or (value is not None and token[1] != value):
            raise _Unsupported(token)
        pos += 1
        return token[1]

    def expression():
        value = term()
        while peek() == ("p", "+"):
            take("p", "+")
            right = term()
            if not (isinstance(value, str) and isinstance(right, str)):
                raise _Unsupported("+")
            value += right
        return value

    def term():
        kind, value = peek()
        if kind in ("str", "num"):
            take()
            return value
        if (kind, value) == ("p", "["):
            take()
            items = []
            while peek() != ("p", "]"):
                items.append(expression())
                if peek() == ("p", ","):
                    take()
            take("p", "]")
            return items
        if (kind, value) == ("p", "{"):
            take()
            result = {}
            while peek() != ("p", "}"):
                key_kind, key = peek()
                if key_kind not in ("id", "str"):
                    raise _Unsupported(key)
                take()
                take("p", ":")
                result[key] = expression()
                if peek() == ("p", ","):
                    take()
            take("p", "}")
            return result
        if kind == "id":
            name = take()
            if name == "Object" and peek() == ("p", "."):
                take()
                if take("id") != "freeze":
                    raise _Unsupported("Object.*")
                take("p", "(")
                inner = expression()
                take("p", ")")
                return inner
            if name in env:
                result = env[name]
                # Member access on an earlier object constant: NAME.key
                while peek() == ("p", "."):
                    take()
                    key = take("id")
                    if not (isinstance(result, dict) and key in result):
                        raise _Unsupported(f"{name}.{key}")
                    result = result[key]
                return result
        raise _Unsupported((kind, value))

    while pos < len(tokens):
        if peek()[1] == "export" and peek(1)[1] == "const" and peek(2)[0] == "id" and peek(3) == ("p", "="):
            name = peek(2)[1]
            start = pos + 4
            pos = start
            try:
                value = expression()
                take("p", ";")
                env[name] = value
                continue
            except _Unsupported:
                pos = start
                depth = 0
                while pos < len(tokens):
                    kind, value = tokens[pos]
                    pos += 1
                    if kind == "p" and value in "([{":
                        depth += 1
                    elif kind == "p" and value in ")]}":
                        depth -= 1
                    elif (kind, value) == ("p", ";") and depth == 0:
                        break
                continue
        pos += 1
    return env


def test_js_evaluator():
    source = (
        "import x from './y.js';\n"
        "// comment with 'quotes'\n"
        "export const A = 'one ' + \"two\" + 'it\\'s';\n"
        "export const B = Object.freeze({ k: Object.freeze(['a', 'b']), 'q-r': 5, m: A });\n"
        "export const C = Object.freeze(B.k.map((v) => v));\n"
        "export function f() { return 1; }\n"
        "export const D = [1, 2.5];\n"
        "export const E = Object.freeze({ first: B.k, five: B['q-r'] });\n"
        "export const F = Object.freeze({ m: B.m, missing: B.zz });\n"
        "export const G = { m: B.m };\n"
    )
    assert js_constants(source) == {
        "A": "one twoit's",
        "B": {"k": ["a", "b"], "q-r": 5, "m": "one twoit's"},
        "D": [1, 2.5],
        "G": {"m": "one twoit's"},
    }


FRONT_ALLERGENS = js_constants(frontend(N14))
FRONT_NUTRITION = js_constants(frontend(N15))


# ═══════════════════════════════════════════════════════════════
# Fixed texts: blueprint = backend = API = frontend = docs
# (criteria 28, 37, 40, 51, 60)
# ═══════════════════════════════════════════════════════════════
def test_backend_constants_equal_the_blueprint():
    backend = {**A.FIXED_TEXTS, **N.FIXED_TEXTS, **E.FIXED_TEXTS}
    assert len(backend) == len(A.FIXED_TEXTS) + len(N.FIXED_TEXTS) + len(E.FIXED_TEXTS)
    assert backend == SPEC_TEXTS


FRONTEND_TEXT_NAMES = {
    "preparation_warning": (FRONT_ALLERGENS, "PREPARATION_WARNING"),
    "none_confirmed_label": (FRONT_ALLERGENS, "NONE_CONFIRMED_LABEL"),
    "none_confirmed_helper": (FRONT_ALLERGENS, "NONE_CONFIRMED_HELPER"),
    "none_identified_label": (FRONT_ALLERGENS, "NONE_IDENTIFIED_LABEL"),
    "legacy_flag_label": (FRONT_ALLERGENS, "LEGACY_FLAG_LABEL"),
    "legacy_unverified_notice": (FRONT_ALLERGENS, "LEGACY_UNVERIFIED_NOTICE"),
    "disclaimer": (FRONT_NUTRITION, "DISCLAIMER"),
    "uncertainty.nutrition_unstandardized": (FRONT_NUTRITION, "NUTRITION_BASIS_NOTICE"),
    "uncertainty.nutrition_incomplete": (FRONT_NUTRITION, "NUTRITION_INCOMPLETE_TEXT"),
}


@pytest.mark.parametrize("key", sorted(FRONTEND_TEXT_NAMES))
def test_frontend_constant_equals_the_blueprint(key):
    constants, name = FRONTEND_TEXT_NAMES[key]
    assert constants[name] == SPEC_TEXTS[key]


def test_frontend_outcome_texts_equal_backend_and_blueprint():
    outcomes = FRONT_ALLERGENS["OUTCOME_TEXTS"]
    assert outcomes == E.OUTCOME_TEXTS
    assert outcomes == {
        code: SPEC_TEXTS[f"outcome.{code}"]
        for code in ("no_verified_alternatives", "no_matching_alternatives", "no_candidates", "alternatives_found")
    }


def test_frontend_fixed_text_collections_hold_the_blueprint_texts():
    allergen_texts = FRONT_ALLERGENS["ALLERGEN_FIXED_TEXTS"]
    nutrition_texts = FRONT_NUTRITION["NUTRITION_FIXED_TEXTS"]
    assert len(allergen_texts) == 10
    assert len(nutrition_texts) == 3
    for key, text in {**allergen_texts, **nutrition_texts}.items():
        assert text == SPEC_TEXTS[key], key


def test_the_api_document_repeats_every_fixed_text_exactly():
    assert fixed_texts(read(API_DOC)) == SPEC_TEXTS


def test_metadata_output_uses_the_fixed_texts(client):
    allergens = client.get("/foods/meta/allergens").json()
    assert allergens["preparation_warning"] == SPEC_TEXTS["preparation_warning"]
    goals = client.get("/foods/meta/health-goals").json()
    assert goals["disclaimer"] == SPEC_TEXTS["disclaimer"]


def test_alternatives_output_uses_the_fixed_texts(client, db):
    original = seed_food(db, "Original", category="Snack")
    seed_food(db, "Flagged", category="Snack", gluten=True, sodium=None)
    seed_food(db, "Plain", category="Snack", sugar=30)
    drink = seed_food(db, "Only Drink", category="Drink")

    def post(food_id, body):
        response = client.post(f"/foods/{food_id}/alternatives", json=body)
        assert response.status_code == 200, response.text
        check_invariants(response.json(), limit=body.get("limit", 10))
        return response.json()

    found = post(original.id, {"allergen_profile_status": "none_confirmed"})
    verified = post(original.id, {"allergen_profile_status": "restrictions", "avoid": ["milk"]})
    matching = post(original.id, {"allergen_profile_status": "none_confirmed", "health_goals": ["heart", "diabetic"]})
    nothing = post(drink.id, {"allergen_profile_status": "none_confirmed"})

    assert found["outcome"] == {"code": "alternatives_found", "text": SPEC_TEXTS["outcome.alternatives_found"].format(n=2)}
    assert verified["outcome"] == {"code": "no_verified_alternatives", "text": SPEC_TEXTS["outcome.no_verified_alternatives"]}
    assert matching["outcome"] == {"code": "no_matching_alternatives", "text": SPEC_TEXTS["outcome.no_matching_alternatives"]}
    assert nothing["outcome"] == {"code": "no_candidates", "text": SPEC_TEXTS["outcome.no_candidates"]}
    for response in (found, verified, matching, nothing):
        assert response["disclaimer"] == SPEC_TEXTS["disclaimer"]

    texts = {e["code"]: e["text"] for r in found["results"] for e in r["uncertainty"]}
    assert texts["preparation_dependent"] == SPEC_TEXTS["preparation_warning"]
    assert texts["nutrition_unstandardized"] == SPEC_TEXTS["uncertainty.nutrition_unstandardized"]
    assert texts["nutrition_incomplete"] == SPEC_TEXTS["uncertainty.nutrition_incomplete"]
    assert texts["allergen_ingredient_unverified"] == SPEC_TEXTS["uncertainty.allergen_ingredient_unverified"]
    assert texts["allergen_cross_contact_unverified"] == SPEC_TEXTS["uncertainty.allergen_cross_contact_unverified"]
    assert texts["allergen_ingredient_flagged"] == SPEC_TEXTS["uncertainty.allergen_ingredient_flagged.keyword"].format(labels="Gluten")
    reasons = {r["code"]: r["text"] for res in found["results"] for r in res["reasons"]}
    assert reasons["category"] == SPEC_TEXTS["reason.category"].format(original="Original", category="Snack")

    for response in (found, verified, matching, nothing):
        assert OLD_STATUS not in json.dumps(response)


# ═══════════════════════════════════════════════════════════════
# Vocabulary (criteria 16, 19, 61, 51)
# ═══════════════════════════════════════════════════════════════
def test_allergen_vocabulary_is_identical_everywhere(client):
    codes = list(A.CANONICAL_CODES)
    meta = client.get("/foods/meta/allergens").json()
    assert [entry["code"] for entry in meta["allergens"]] == codes
    assert FRONT_ALLERGENS["ALLERGEN_CODES"] == codes
    assert FRONT_ALLERGENS["ALLERGEN_LABELS"] == A.LABELS
    assert FRONT_ALLERGENS["ALLERGEN_ALIASES"] == {code: list(v) for code, v in A.ALIASES.items()}
    assert FRONT_ALLERGENS["GROUP_ALIASES"] == {alias: list(v) for alias, v in A.GROUP_ALIASES.items()}
    assert FRONT_ALLERGENS["ALLERGEN_STATUSES"] == list(A.STATUSES)
    assert {e["code"]: e["label"] for e in meta["allergens"]} == FRONT_ALLERGENS["ALLERGEN_LABELS"]


def test_frontend_fan_out_equals_the_backend_fan_out():
    assert FRONT_ALLERGENS["LEGACY_COLUMN_FANOUT"] == {
        column: list(codes) for column, codes in A.LEGACY_COLUMN_FANOUT.items()
    }


def test_registration_form_ids_are_the_canonical_codes():
    ids = re.findall(r"^\s+id: '([^']+)'", frontend(M9), re.MULTILINE)
    assert sorted(ids) == sorted(A.CANONICAL_CODES)
    assert len(ids) == len(set(ids))


def test_frontend_presets_equal_the_backend_presets(client):
    meta = client.get("/foods/meta/health-goals").json()
    assert FRONT_NUTRITION["HEALTH_GOAL_PRESETS"] == [
        {"key": preset["key"], "label": preset["label"]} for preset in meta["presets"]
    ]
    assert FRONT_NUTRITION["NUTRITION_FIELDS"] == list(N.NUTRITION_FIELDS)


# ═══════════════════════════════════════════════════════════════
# JSON examples validate against the real models (criterion 62)
# ═══════════════════════════════════════════════════════════════
MODELS = {
    "AlternativesRequest": AlternativesRequest,
    "AlternativesResponse": AlternativesResponse,
    "ErrorResponse": ErrorResponse,
    "MethodNotAllowed": MethodNotAllowed,
    "FoodSchema": FoodSchema,
    "MetaAllergensResponse": MetaAllergensResponse,
    "HealthGoalsResponse": HealthGoalsResponse,
    "AllergenStatusMap": AllergenStatusMap,
}


def _check_response_example(data):
    excluded = data["excluded"]
    counts = excluded["by_primary_reason"]
    assert list(counts) == list(E.PRIMARY_REASON_CODES)
    assert sum(counts.values()) == excluded["total"]
    assert data["eligible_total"] + excluded["total"] == data["candidates_considered"]
    assert len(data["results"]) <= data["eligible_total"]
    for detail in excluded["allergen_detail"]["by_allergen"].values():
        for dim in detail.values():
            assert sum(dim[s] for s in A.STATUSES) == data["candidates_considered"]
            assert sum(dim["unknown_by_provenance"].values()) == dim["unknown"]
    allergen_counted = sum(counts[r] for r in E.ALLERGEN_REASON_CODES)
    expected = E.decide_outcome(data["candidates_considered"], data["eligible_total"], counts)
    assert data["outcome"]["code"] == expected, allergen_counted
    assert data["outcome"]["text"] == E.outcome_text(expected, data["eligible_total"])


@pytest.mark.parametrize("path", [API_DOC, SPEC_PART2], ids=["food-discovery.md", "rev7_part2.md"])
def test_every_json_example_validates_against_its_model(path):
    examples = json_examples(read(path))
    blocks = re.findall(r"```json\n", read(path))
    assert len(examples) == len(blocks)  # every JSON block names its schema
    used = {schema for schema, _ in examples}
    assert {
        "AlternativesRequest", "AlternativesResponse", "ErrorResponse", "FoodSchema",
        "MetaAllergensResponse", "HealthGoalsResponse",
    } <= used
    for schema, data in examples:
        model = MODELS[schema]
        validated = model.model_validate(data)
        dumped = validated.model_dump()
        assert dumped == data, schema
        if schema == "AlternativesResponse":
            _check_response_example(data)


def test_document_examples_reject_tampering():
    examples = dict(json_examples(read(API_DOC))[:2])  # Example A: request, then response
    response = dict(examples["AlternativesResponse"])
    response["unexpected"] = 1
    with pytest.raises(ValueError):
        AlternativesResponse.model_validate(response)
    request = dict(examples["AlternativesRequest"], extra=True)
    with pytest.raises(ValueError):
        AlternativesRequest.model_validate(request)


def test_document_metadata_examples_equal_the_live_endpoints(client):
    examples = {schema: data for schema, data in json_examples(read(API_DOC))}
    assert examples["MetaAllergensResponse"] == client.get("/foods/meta/allergens").json()
    assert examples["HealthGoalsResponse"] == client.get("/foods/meta/health-goals").json()


# ═══════════════════════════════════════════════════════════════
# Documentation (criteria 20, 41, 57)
# ═══════════════════════════════════════════════════════════════
def _sections(markdown: str) -> dict:
    parts = re.split(r"^## ", markdown, flags=re.MULTILINE)
    return {part.split("\n", 1)[0]: part for part in parts[1:]}


def test_the_api_document_covers_the_required_sections():
    sections = _sections(read(API_DOC))
    titles = list(sections)
    assert titles == [
        "1. Allergen model",
        "2. Fixed texts",
        "3. Legacy allergen booleans: display rule",
        "4. Exclusion precedence, invariants and outcome",
        "5. API contract",
        "6. Breaking changes",
        "7. Backlog (not fixed in Batch 1)",
    ]
    doc = read(API_DOC)
    for value in A.INGREDIENT_PROVENANCE + A.CROSS_CONTACT_PROVENANCE + E.PRIMARY_REASON_CODES:
        assert f"`{value}`" in doc, value
    for path in UNRENDERED:
        assert f"frontend/src/{path}" in sections["7. Backlog (not fixed in Batch 1)"], path
    assert "Copy cleanup" in sections["7. Backlog (not fixed in Batch 1)"]


def test_readme_links_the_api_document():
    readme = read(README)
    assert "(docs/api/food-discovery.md)" in readme
    assert "### `POST /foods/{food_id}/alternatives`" in readme
    assert "### `GET /foods/{food_id}/alternatives`" not in readme


def test_old_status_name_only_in_the_breaking_changes_section():
    sections = _sections(read(API_DOC))
    for title, body in sections.items():
        if title == "6. Breaking changes":
            assert OLD_STATUS in body
        else:
            assert OLD_STATUS not in body, title


def test_the_api_document_mentions_cooking_or_heating_only_in_the_warning():
    doc = read(API_DOC).replace(SPEC_TEXTS["preparation_warning"], "")
    assert not re.search(r"\b(cook|heat)", doc, re.IGNORECASE)


# ═══════════════════════════════════════════════════════════════
# Frontend source: what the app renders
# ═══════════════════════════════════════════════════════════════
_IMPORT = re.compile(r"""(?:from|import)\s*\(?\s*['"](\.[^'"]+)['"]""")


def _resolve(from_file: Path, spec: str) -> Path | None:
    base = (from_file.parent / spec).resolve()
    for candidate in (base, base.with_name(base.name + ".jsx"), base.with_name(base.name + ".js"),
                      base.with_name(base.name + ".mjs"), base / "index.jsx", base / "index.js"):
        if candidate.is_file():
            return candidate
    return None


def _imports(path: Path) -> set[Path]:
    if path.suffix not in (".js", ".jsx", ".mjs"):
        return set()
    found = set()
    for spec in _IMPORT.findall(read(path)):
        resolved = _resolve(path, spec)
        if resolved is not None:
            found.add(resolved)
    return found


def _rendered() -> set[str]:
    """Every module reachable from the app entry point, relative to src/."""
    start = FRONTEND_SRC / "index.jsx"
    seen = {start.resolve()}
    queue = [start.resolve()]
    while queue:
        current = queue.pop()
        for module in _imports(current):
            if module not in seen:
                seen.add(module)
                queue.append(module)
    return {p.relative_to(FRONTEND_SRC.resolve()).as_posix() for p in seen if p.suffix in (".js", ".jsx", ".mjs")}


RENDERED = _rendered()


def test_rendered_set_includes_the_batch_pages_and_excludes_the_unrendered_files():
    for path in (M7, M8, M9, M10, M11, M12, N14, N15):
        assert path in RENDERED, path
    for path in UNRENDERED:
        assert path not in RENDERED, path
    assert not (FRONTEND_SRC / "pages/user-registration/components/TrustSignals.jsx").exists()


def _scope_sources():
    return {path: frontend(path) for path in SCOPE_FRONTEND}


_JS_STRING_OR_COMMENT = re.compile(
    r"""('(?:[^'\\\n]|\\.)*'|"(?:[^"\\\n]|\\.)*"|`(?:[^`\\]|\\.)*`)|(//[^\n]*|/\*.*?\*/)""",
    re.DOTALL,
)


def strip_js_comments(source: str) -> str:
    """Remove // and /* */ comments, keeping string and template literals intact."""
    return _JS_STRING_OR_COMMENT.sub(lambda m: m.group(1) if m.group(1) is not None else "", source)


def test_strip_js_comments_keeps_strings():
    source = "const a = 'http://x/alternatives'; // /alternatives\n/* /alternatives */ const b = `/y`;"
    assert strip_js_comments(source) == "const a = 'http://x/alternatives'; \n const b = `/y`;"


# ── Criterion 58: no "Safe" / "Friendly" anywhere the app renders ──
def test_no_rendered_component_says_safe_or_friendly():
    for path in sorted(RENDERED):
        source = frontend(path)
        assert not re.search(r"Safe|Friendly", source), path
        assert "No Major Allergens" not in source, path


def test_modal_allergen_tab_follows_the_legacy_display_rule():
    source = frontend(M8)
    assert "label: 'Allergens'" in source
    assert ">Allergen information<" in source
    assert "'safety'" not in source
    for name in ("legacyAllergenDisplay(", "LEGACY_FLAG_LABEL", "LEGACY_UNVERIFIED_NOTICE", "PREPARATION_WARNING"):
        assert name in source, name
    # The tab renders labels from the helper only; no loop over raw legacy flags.
    assert "Object.entries(foodItem.allergens" not in source
    assert "Object.values(foodItem.allergens" not in source


def test_search_and_comparison_do_not_read_the_legacy_booleans():
    for path in (M11, M12):
        assert not re.search(r"\ballergens\b", frontend(path)), path
    assert "safety" not in frontend(M12).lower()
    assert "Compare nutrition and sustainability." in frontend(M12)


def test_batch_pages_import_none_of_the_unrendered_files():
    unrendered = {(FRONTEND_SRC / path).resolve() for path in UNRENDERED}
    for path in (M8, M11, M12):
        assert not (_imports(FRONTEND_SRC / path) & unrendered), path


# ── Criteria 1, 2, 5, 56: one engine, on the server ──
def test_no_client_side_engine_or_category_lists():
    for path in RENDERED | set(UNRENDERED):
        source = frontend(path)
        assert "getSmartSwaps" not in source, path
        assert not re.search(r"CATEGORY_SWAP_GROUPS|MEAL_CATEGORIES|SIDE_CATEGORIES", source), path
    assert not re.search(r"'(Lunch|Dinner|Breakfast|Snack|Dessert|Drink)'", frontend(M8))


def test_modal_renders_the_server_results_in_order():
    source = frontend(M8)
    assert "getAlternatives(" in source
    assert "alternatives.results.map(" in source
    assert not re.search(r"results\s*\.\s*(sort|filter|slice|reverse|splice)\s*\(", source)
    assert "nutrition_score" not in source.split("const NutritionExplorerModal")[0]


def test_only_the_api_helper_builds_the_alternatives_request():
    for path in RENDERED:
        source = strip_js_comments(frontend(path))
        if path == M6:
            assert "method: 'POST'" in source
            continue
        assert not re.search(r"/alternatives", source), path
    # No query-string form of the alternatives request (a property read such as
    # `x?.alternatives?.map` is not a request).
    for path in RENDERED | set(UNRENDERED):
        assert not re.search(r"/alternatives\?|alternatives\?(health|avoid|allergen)", frontend(path)), path


# ── Criterion 9: nothing persists the profile ──
def test_profile_never_reaches_storage_urls_or_navigation_state():
    persistence = re.compile(
        r"localStorage|sessionStorage|indexedDB|document\.cookie|cookieStore|"
        r"history\.(push|replace)State|window\.location"
    )
    for path in (M8, M9, M10, "utils/allergenProfile.js", "context/AllergenProfileContext.jsx", M6):
        assert not persistence.search(frontend(path)), path
    leak = re.compile(r"(navigate\([^)]*(profile|avoid|health_?[Gg]oals))|\?(avoid|health_goal|allergen)")
    for path in SCOPE_FRONTEND:
        assert not leak.search(frontend(path)), path


# ── Criteria 28, 40, 47, 60: the fixed texts are shown where required ──
def test_pages_render_the_fixed_texts_from_the_constants():
    modal = frontend(M8)
    for expression in (
        "alternatives.outcome.text", "reason.text", "entry.text", "alternatives.disclaimer",
        "{PREPARATION_WARNING}", "{NUTRITION_BASIS_NOTICE}", "{NONE_CONFIRMED_LABEL}", "{NONE_CONFIRMED_HELPER}",
    ):
        assert expression in modal, expression
    form = frontend(M9)
    assert "{NONE_CONFIRMED_LABEL}" in form and "{NONE_CONFIRMED_HELPER}" in form
    for path in (M11, M12):
        assert "{NUTRITION_BASIS_NOTICE}" in frontend(path), path
    # No page carries its own copy of a fixed text.
    for path in (M8, M9, M10, M11, M12):
        source = frontend(path)
        for key in ("preparation_warning", "none_confirmed_label", "none_confirmed_helper", "disclaimer",
                    "uncertainty.nutrition_unstandardized", "legacy_flag_label", "legacy_unverified_notice"):
            assert SPEC_TEXTS[key] not in source, (path, key)


# ── Criterion 52: null is "Not available", never 0 ──
def test_search_and_comparison_never_default_nutrition_to_zero():
    for path in (M11, M12):
        source = frontend(path)
        assert not re.search(r"(\|\||\?\?)\s*0\b", source), path
        assert "getBestStyle" not in source and "bestVal" not in source, path
    assert "passesNutrientFilter(" in frontend(M11)
    assert "formatFoodNutrient(" in frontend(M11)
    assert "formatFoodNutrient(" in frontend(M12)
    assert FRONT_NUTRITION["NOT_AVAILABLE_LABEL"] == "Not available"


# ── Criteria 29, 41, 46, 48: wording in the Batch 1 files ──
ABSENCE = (
    "allergen-free", "free of allergens", "free from allergens", "no allergens",
    "no known allergens", "no allergies", "safe for you", "safe to eat", "contains no",
)
COMPARATIVE = ("lower than", "higher than", "better", "healthier", "best value", "winner")


def _without_warning(source: str) -> str:
    """Source text with the preparation warning's definition removed."""
    source = re.sub(r"export const PREPARATION_WARNING =.*?;\n", "", source, flags=re.DOTALL)
    return re.sub(r"PREPARATION_WARNING = \(.*?\)\n", "", source, flags=re.DOTALL)


BACKEND_TEXT_SOURCES = ("domain/allergens.py", "domain/nutrition_rules.py", "services/discovery_engine.py")


def test_no_absence_or_safety_claims_in_the_batch_pages():
    for path in (M8, M9, M10):
        lowered = frontend(path).lower()
        for phrase in ABSENCE:
            assert phrase not in lowered, (path, phrase)
        assert not re.search(r"\bsafe", lowered), path


def test_cooking_or_heating_appears_only_in_the_warning():
    # "cookie" (browser storage) is not about cooking.
    pattern = re.compile(r"\b(cook(?!ie)|heat)", re.IGNORECASE)
    for path, source in _scope_sources().items():
        assert not pattern.search(_without_warning(source)), path
    for relative in BACKEND_TEXT_SOURCES:
        assert not pattern.search(_without_warning(read(BACKEND / relative))), relative


def test_no_comparative_claims_in_rendered_files():
    # Scope: every frontend module reachable from the app entry point (which
    # includes the Batch 1 frontend files) and the backend text modules.
    for path in sorted(RENDERED | set(SCOPE_FRONTEND)):
        lowered = frontend(path).lower()
        for word in COMPARATIVE:
            assert word not in lowered, (path, word)
    for relative in BACKEND_TEXT_SOURCES:
        lowered = read(BACKEND / relative).lower()
        for word in COMPARATIVE:
            assert word not in lowered, (relative, word)


def test_no_portion_or_standardised_basis_in_the_batch_files():
    for path, source in _scope_sources().items():
        assert not re.search(r"1 Portion|per portion|\bstandardi[sz]ed\b", source, re.IGNORECASE), path


# ── Criterion 20: the old status name is gone from the frontend ──
def test_old_status_name_absent_from_frontend_code():
    # Unit tests under src/__tests__ may name it in order to reject it.
    for path in FRONTEND_SRC.rglob("*"):
        if path.is_file() and path.suffix in (".js", ".jsx", ".mjs", ".css", ".html") and "__tests__" not in path.parts:
            assert OLD_STATUS not in read(path), path
