"""Validate the three Rev. 7 blueprint part files. Reads only the files given on
the command line; writes nothing; no network. Usage:
    python -I -B validate_rev7.py part1.md part2.md part3.md
"""
import json
import re
import sys
from typing import Dict, List, Literal, Optional, Union

from pydantic import BaseModel, ConfigDict, model_validator

P1, P2, P3 = (open(p, encoding="utf-8").read() for p in sys.argv[1:4])
ALL = P1 + "\n" + P2 + "\n" + P3
RESULTS = []


def ok(name, detail=""):
    RESULTS.append((name, detail))
    print("PASS", name, detail)


def check(cond, msg):
    if not cond:
        raise AssertionError(msg)


# ---------- strict JSON ----------
def reject(c):
    raise ValueError("non-finite constant " + c)


def no_dupes(pairs):
    keys = [k for k, _ in pairs]
    if len(keys) != len(set(keys)):
        raise ValueError("duplicate key in object: %r" % keys)
    return dict(pairs)


def strict_loads(s):
    return json.loads(s, parse_constant=reject, object_pairs_hook=no_dupes)


# self-test: the parser must reject what it claims to reject
for bad in ('{"a": 1, "a": 2}', '{"a": NaN}', '{"a": Infinity}', '{"a": -Infinity}', '{"a": 1,}'):
    try:
        strict_loads(bad)
    except ValueError:
        continue
    raise SystemExit("strict parser self-test failed for " + bad)
ok("strict parser self-test", "rejects duplicate keys, NaN, Infinity, -Infinity, trailing comma")

# ---------- vocabulary ----------
CODES = ["milk", "eggs", "peanuts", "tree_nuts", "fish", "shellfish", "soy", "wheat", "gluten", "sesame", "sulfites"]
Code = Literal["milk", "eggs", "peanuts", "tree_nuts", "fish", "shellfish", "soy", "wheat", "gluten", "sesame", "sulfites"]
Status = Literal["present", "possible", "absent", "unknown"]
ING_PROV = ["legacy_seed_heuristic", "legacy_default_false", "legacy_null", "no_allergen_record", "not_tracked", "derived_from_wheat"]
CC_PROV = ["no_source", "insufficient_preparation_evidence", "verified_preparation_source"]
IngProv = Literal["legacy_seed_heuristic", "legacy_default_false", "legacy_null", "no_allergen_record", "not_tracked", "derived_from_wheat"]
CcProv = Literal["no_source", "insufficient_preparation_evidence", "verified_preparation_source"]
Goal = Literal["diabetic", "heart", "weight", "muscle", "kidney", "cholesterol"]
GOALS = ["diabetic", "heart", "weight", "muscle", "kidney", "cholesterol"]
NField = Literal["calories", "protein", "fat", "carbohydrates", "fiber", "sugar", "sodium"]
RANKS = ["allergen_ingredient_present", "allergen_cross_contact_present", "allergen_ingredient_possible",
         "allergen_cross_contact_possible", "allergen_ingredient_unknown", "allergen_cross_contact_unknown",
         "nutrition_invalid", "nutrition_missing", "failed_filter"]
ERROR_CODES = ["INVALID_FOOD_ID", "UNKNOWN_ALLERGEN", "UNKNOWN_HEALTH_GOAL", "ALLERGEN_PROFILE_REQUIRED",
               "PROFILE_INCONSISTENT", "FOOD_NOT_FOUND"]
Num = Union[int, float]


class M(BaseModel):
    model_config = ConfigDict(extra="forbid", strict=True)


# ---------- schemas (mirrors of section 4) ----------
class AlternativesRequest(M):
    allergen_profile_status: Optional[str] = None
    avoid: List[str] = []
    health_goals: List[str] = []
    limit: int = 10

    @model_validator(mode="after")
    def _v(self):
        check(1 <= self.limit <= 50, "limit range")
        return self


class Applied(M):
    allergen_profile_status: Literal["restrictions", "none_confirmed"]
    allergen_filtering: Literal["applied", "not_applied"]
    avoid: List[Code]
    health_goals: List[Goal]
    category_scope: List[str]
    category_scope_source: Literal["swap_group", "unmapped_same_category_only"]
    nutrition_basis: Literal["as_stored_unstandardized"]


class PrimaryReasonCounts(M):
    allergen_ingredient_present: int
    allergen_cross_contact_present: int
    allergen_ingredient_possible: int
    allergen_cross_contact_possible: int
    allergen_ingredient_unknown: int
    allergen_cross_contact_unknown: int
    nutrition_invalid: int
    nutrition_missing: int
    failed_filter: int


class IngUnknownByProv(M):
    legacy_default_false: int
    legacy_null: int
    no_allergen_record: int
    not_tracked: int


class CcUnknownByProv(M):
    no_source: int
    insufficient_preparation_evidence: int


class IngredientDimCounts(M):
    present: int
    possible: int
    absent: int
    unknown: int
    unknown_by_provenance: IngUnknownByProv


class CrossContactDimCounts(M):
    present: int
    possible: int
    absent: int
    unknown: int
    unknown_by_provenance: CcUnknownByProv


class ByAllergen(M):
    ingredient: IngredientDimCounts
    cross_contact: CrossContactDimCounts


class AllergenDetail(M):
    unit: Literal["candidate_allergen_pairs"]
    additive_across_allergens: Literal[False]
    by_allergen: Dict[Code, ByAllergen]


class Excluded(M):
    total: int
    by_primary_reason: PrimaryReasonCounts
    allergen_detail: AllergenDetail


class Outcome(M):
    code: Literal["no_candidates", "alternatives_found", "no_verified_alternatives", "no_matching_alternatives"]
    text: str


class Comparability(M):
    cross_food_nutrition_comparable: Literal[False]
    reason: Literal["unknown_and_inconsistent_measurement_basis"]


class Nutrition(M):
    calories: Optional[Num]
    protein: Optional[Num]
    fat: Optional[Num]
    carbohydrates: Optional[Num]
    fiber: Optional[Num]
    sugar: Optional[Num]
    sodium: Optional[Num]


class NutritionQuality(M):
    nutrition_record_present: bool
    missing_fields: List[NField]
    invalid_fields: List[NField]


class NutritionBasis(M):
    code: Literal["as_stored_unstandardized"]
    standardized: Literal[False]
    source_portion: None
    source_portion_known: Literal[False]
    serving_label_as_stored: Optional[str]
    serving_label_reliable: Literal[False]
    value_provenance: Literal["unverified_manual_entry"]


ING_ALLOWED = {"legacy_seed_heuristic": {"possible"}, "legacy_default_false": {"unknown"}, "legacy_null": {"unknown"},
               "no_allergen_record": {"unknown"}, "not_tracked": {"unknown"}, "derived_from_wheat": {"possible", "present"}}
CC_ALLOWED = {"no_source": {"unknown"}, "insufficient_preparation_evidence": {"unknown", "possible", "present"},
              "verified_preparation_source": {"absent", "possible", "present"}}


class CodeStatus(M):
    ingredient: Status
    ingredient_provenance: IngProv
    cross_contact: Status
    cross_contact_provenance: CcProv

    @model_validator(mode="after")
    def _v(self):
        check(self.ingredient in ING_ALLOWED[self.ingredient_provenance], "ingredient status/provenance pair")
        check(self.cross_contact in CC_ALLOWED[self.cross_contact_provenance], "cross-contact status/provenance pair")
        return self


def check_status_map(raw):
    """AllergenStatusMap: 11 codes in canonical order + the section 1.2 precedence consequences."""
    check(list(raw) == CODES, "allergen_status must hold all 11 codes in canonical order")
    st = {c: CodeStatus.model_validate(v) for c, v in raw.items()}
    no_rec = [c for c in CODES if st[c].ingredient_provenance == "no_allergen_record"]
    check(len(no_rec) in (0, 11), "no_allergen_record must apply to all 11 codes or to none")
    for c in CODES:
        if st[c].ingredient_provenance == "not_tracked":
            check(c in ("wheat", "sesame", "sulfites"), "not_tracked only on wheat/sesame/sulfites")
    if not no_rec:
        for c in ("sesame", "sulfites"):
            check(st[c].ingredient_provenance == "not_tracked", c + " must be not_tracked when a row exists")
    return st


class Preparation(M):
    details_known: bool


class AlternativeFood(M):
    id: int
    name: str
    brand: Optional[str]
    category: Optional[str]
    image: Optional[str]
    serving_size: Optional[str]
    nutrition: Nutrition
    nutrition_quality: NutritionQuality
    nutrition_basis: NutritionBasis
    allergen_status: Dict[Code, CodeStatus]
    preparation: Preparation


class Reason(M):
    code: Literal["filter_threshold", "category", "swap_group"]
    field: Optional[NField] = None
    text: str

    @model_validator(mode="after")
    def _v(self):
        check(("field" in self.model_fields_set) == (self.code == "filter_threshold"), "Reason.field only for filter_threshold")
        return self


ALLERGEN_UNC = {"allergen_ingredient_flagged", "allergen_ingredient_unverified", "allergen_cross_contact_flagged",
                "allergen_cross_contact_unverified"}


class Uncertainty(M):
    code: Literal["allergen_ingredient_flagged", "allergen_ingredient_unverified", "allergen_cross_contact_flagged",
                  "allergen_cross_contact_unverified", "preparation_dependent", "nutrition_unstandardized",
                  "nutrition_incomplete"]
    allergens: Optional[List[Code]] = None
    fields: Optional[List[NField]] = None
    text: str

    @model_validator(mode="after")
    def _v(self):
        check(("allergens" in self.model_fields_set) == (self.code in ALLERGEN_UNC), "Uncertainty.allergens presence")
        check(("fields" in self.model_fields_set) == (self.code == "nutrition_incomplete"), "Uncertainty.fields presence")
        return self


class Result(M):
    rank: int
    eligibility: Literal["eligible"]
    food: AlternativeFood
    reasons: List[Reason]
    uncertainty: List[Uncertainty]


class AlternativesResponse(M):
    applied: Applied
    candidates_considered: int
    eligible_total: int
    results: List[Result]
    excluded: Excluded
    outcome: Outcome
    comparability: Comparability
    disclaimer: str


class ErrorResponse(M):
    detail: str
    error_code: Literal["INVALID_FOOD_ID", "UNKNOWN_ALLERGEN", "UNKNOWN_HEALTH_GOAL", "ALLERGEN_PROFILE_REQUIRED",
                        "PROFILE_INCONSISTENT", "FOOD_NOT_FOUND"]


class MethodNotAllowed(M):
    detail: Literal["Method Not Allowed"]


class LegacyAllergens(M):
    dairy: Optional[bool]
    nuts: Optional[bool]
    gluten: Optional[bool]
    soy: Optional[bool]
    eggs: Optional[bool]
    shellfish: Optional[bool]


class Sustainability(M):
    carbon_footprint: Optional[Num]
    water_usage: Optional[Num]
    land_use: Optional[Num]
    sustainability_score: Optional[Num]


class FoodSchema(M):
    id: int
    name: str
    brand: Optional[str]
    category: Optional[str]
    image: Optional[str]
    description: Optional[str]
    serving_size: Optional[str]
    price_range: Optional[str]
    nutrition_score: Optional[Num]
    sustainability_score: Optional[Num]
    nutrition: Optional[Nutrition]
    nutrition_quality: NutritionQuality
    allergens: Optional[LegacyAllergens]
    sustainability: Optional[Sustainability]


class MetaAllergen(M):
    code: Code
    label: str
    aliases: List[str]


class GroupAlias(M):
    alias: str
    expands_to: List[Code]


class Dimensions(M):
    ingredient: List[Status]
    cross_contact: List[Status]


class Provenance(M):
    ingredient: List[IngProv]
    cross_contact: List[CcProv]


class MetaAllergensResponse(M):
    allergens: List[MetaAllergen]
    group_aliases: List[GroupAlias]
    dimensions: Dimensions
    provenance: Provenance
    preparation_warning: str


class Filter(M):
    field: NField
    op: Literal["lt", "gt"]
    value: Num
    unit: Literal["g", "mg", "kcal"]


class Preset(M):
    key: Goal
    label: str
    kind: Literal["exploratory_filter"]
    basis: Literal["as_stored_unstandardized"]
    filters: List[Filter]


class HealthGoalsResponse(M):
    presets: List[Preset]
    disclaimer: str


SCHEMAS = {c.__name__: c for c in (AlternativesRequest, AlternativesResponse, ErrorResponse, MethodNotAllowed,
                                   FoodSchema, MetaAllergensResponse, HealthGoalsResponse)}

# ---------- 1. JSON blocks: count, labels, strict parse ----------
fence_count = {n: len(re.findall(r"^```json$", t, re.M)) for n, t in (("part1", P1), ("part2", P2), ("part3", P3))}
labelled = re.findall(r"^Schema: `(\w+)`\n\n```json\n(.*?)\n```$", P2, re.S | re.M)
check(fence_count["part1"] == 0 and fence_count["part3"] == 0, "json blocks are expected only in part 2")
check(len(labelled) == fence_count["part2"], "every json block must carry a Schema label (%d labelled, %d fences)"
      % (len(labelled), fence_count["part2"]))
parsed = [(name, strict_loads(body)) for name, body in labelled]
ok("json blocks strictly parsed", str(len(parsed)))

# ---------- 2. schema validation ----------
by_schema = {}
for name, obj in parsed:
    if name == "AllergenStatusMap":
        check_status_map(obj)
    else:
        check(name in SCHEMAS, "unknown schema label " + name)
        SCHEMAS[name].model_validate(obj)
    by_schema.setdefault(name, []).append(obj)
for name in sorted(by_schema):
    ok("schema-validated: " + name, str(len(by_schema[name])))
check(set(by_schema) == set(SCHEMAS) | {"AllergenStatusMap"}, "every documented schema needs an example")

# negative controls: the schema validation must be able to fail
neg = 0
base = by_schema["AlternativesResponse"][0]
for mutate in (lambda d: d.pop("outcome"), lambda d: d.update(extra_field=1),
               lambda d: d["excluded"]["by_primary_reason"].pop("allergen_cross_contact_possible"),
               lambda d: d["applied"].update(allergen_filtering="maybe")):
    d = json.loads(json.dumps(base))
    mutate(d)
    try:
        AlternativesResponse.model_validate(d)
    except Exception:
        neg += 1
kid = json.loads(json.dumps(by_schema["HealthGoalsResponse"][0]))
del kid["presets"][4]["basis"]
try:
    HealthGoalsResponse.model_validate(kid)
except Exception:
    neg += 1
check(neg == 5, "negative controls: %d of 5 rejected" % neg)
ok("negative controls rejected", "5 of 5 (missing field, extra field, missing rank 4, bad enum, kidney without basis)")

# ---------- 3. fixed texts ----------
FIXED = dict(re.findall(r"^Fixed text `([\w.]+)`[^\n]*:\n\n```text\n(.*?)\n```$", P1, re.S | re.M))
EXPECTED_FIXED = {"preparation_warning", "disclaimer", "outcome.no_verified_alternatives", "outcome.no_matching_alternatives",
                  "outcome.no_candidates", "outcome.alternatives_found", "none_confirmed_label", "none_confirmed_helper",
                  "none_identified_label", "uncertainty.allergen_ingredient_flagged.keyword",
                  "uncertainty.allergen_ingredient_flagged.generic", "uncertainty.allergen_ingredient_unverified",
                  "uncertainty.allergen_cross_contact_flagged", "uncertainty.allergen_cross_contact_unverified",
                  "uncertainty.nutrition_unstandardized", "uncertainty.nutrition_incomplete", "reason.filter_threshold",
                  "reason.category", "reason.swap_group", "legacy_flag_label", "legacy_unverified_notice"}
check(set(FIXED) == EXPECTED_FIXED, "fixed text keys: %s" % sorted(set(FIXED) ^ EXPECTED_FIXED))
check(len(re.findall(r"^Fixed text `", P1, re.M)) == len(FIXED), "each fixed text defined exactly once")
check(len(re.findall(r"^```text$", ALL, re.M)) == len(FIXED), "text blocks are used only for fixed texts")
ok("fixed texts defined once each", str(len(FIXED)))

meta_a = by_schema["MetaAllergensResponse"][0]
meta_h = by_schema["HealthGoalsResponse"][0]
LABEL = {a["code"]: a["label"] for a in meta_a["allergens"]}
copies = {"disclaimer": 0, "preparation_warning": 0, "outcome": 0, "uncertainty": 0, "reason": 0}

check(meta_a["preparation_warning"] == FIXED["preparation_warning"], "metadata preparation warning")
copies["preparation_warning"] += 1
check(meta_h["disclaimer"] == FIXED["disclaimer"], "metadata disclaimer")
copies["disclaimer"] += 1

BANNED = ["allergen-free", "free of allergens", "free from allergens", "no allergens", "no known allergens", "no allergies",
          "safe for you", "safe to eat", "contains no"]
for k, t in FIXED.items():
    for b in BANNED:
        check(b not in t.lower(), "banned phrase %r in fixed text %s" % (b, k))
    if k != "preparation_warning":
        check("cook" not in t.lower() and "heat" not in t.lower(), "cooking/heating outside the warning: " + k)
ok("fixed texts free of banned phrases (criterion 29 list) and of cooking/heating outside the warning")

# ---------- 4. metadata conformance ----------
check([a["code"] for a in meta_a["allergens"]] == CODES, "metadata allergens: 11 codes in canonical order")
check(meta_a["dimensions"] == {"ingredient": ["present", "possible", "absent", "unknown"],
                               "cross_contact": ["present", "possible", "absent", "unknown"]}, "metadata dimensions")
check(meta_a["provenance"] == {"ingredient": ING_PROV, "cross_contact": CC_PROV}, "metadata provenance lists")
doc_ing = re.findall(r"^- `(\w+)` — ", P1.split("Ingredient provenance (6 values):")[1].split("Legacy column fan-out")[0], re.M)
doc_cc = re.findall(r"^- `(\w+)` — ", P1.split("Cross-contact provenance (3 values):")[1].split("With the current data")[0], re.M)
check(doc_ing == ING_PROV and doc_cc == CC_PROV, "section 1.2 provenance definitions match metadata")
alias_doc = P1.split("### 1.1")[1].split("### 1.2")[0]
for a in meta_a["allergens"]:
    line = re.search(r"^  - `%s` — (.*)$" % a["code"], alias_doc, re.M).group(1)
    check(re.findall(r"`([^`]+)`", line) == a["aliases"], "aliases for " + a["code"])
check(meta_a["group_aliases"] == [{"alias": "nuts", "expands_to": ["peanuts", "tree_nuts"]},
                                  {"alias": "seafood", "expands_to": ["fish", "shellfish"]}], "group aliases")
check([p["key"] for p in meta_h["presets"]] == GOALS, "six presets in order")
for p in meta_h["presets"]:
    check(set(p) == {"key", "label", "kind", "basis", "filters"} and p["filters"], "preset fields: " + p["key"])
THRESHOLDS = {"diabetic": [("sugar", "lt", 5, "g"), ("fiber", "gt", 2, "g")],
              "heart": [("sodium", "lt", 400, "mg"), ("fat", "lt", 10, "g")],
              "weight": [("calories", "lt", 400, "kcal")], "muscle": [("protein", "gt", 10, "g")],
              "kidney": [("sodium", "lt", 300, "mg"), ("protein", "lt", 20, "g")],
              "cholesterol": [("fat", "lt", 8, "g")]}
for p in meta_h["presets"]:
    got = [(f["field"], f["op"], f["value"], f["unit"]) for f in p["filters"]]
    check(got == THRESHOLDS[p["key"]], "thresholds for " + p["key"])
ok("metadata examples conform", "11 codes, provenance 6+3 equal to section 1.2, aliases, 6 presets each with kind and basis, router thresholds")

# ---------- 5. error precedence ----------
err_sec = P2.split("### 4.2")[1].split("### 4.3")[0]
listed = re.findall(r"^\d\. (?:400|422|404) `(\w+)`", err_sec, re.M)
check(listed == ERROR_CODES, "error precedence list: %s" % listed)
check(len(re.findall(r"^\d\. ", err_sec, re.M)) == 7, "seven precedence entries")
check([e["error_code"] for e in by_schema["ErrorResponse"]] == ERROR_CODES, "one example per error code, in precedence order")
ok("error precedence complete", "7 entries; 6 application error examples in the same order")

# ---------- 6. primary-reason precedence ----------
prec = P1.split("### 2.1")[1].split("### 2.2")[0]
check(re.findall(r"^(\d)\. `(\w+)` — ", prec, re.M) == [(str(i + 1), r) for i, r in enumerate(RANKS)], "precedence ranks 1-9")
resp_sec = P2.split("\n`PrimaryReasonCounts` — ")[1].split("\n`AllergenDetail`:")[0]
check(re.findall(r"^- `(\w+)`$", resp_sec, re.M) == RANKS, "PrimaryReasonCounts field list")
ok("primary-reason precedence complete", "ranks 1-9 in Part 1 equal the schema field list in Part 2")

# ---------- 7. response semantics ----------
requests = by_schema["AlternativesRequest"]
responses = by_schema["AlternativesResponse"]
check(len(requests) == len(responses) == 2, "two request/response pairs")
PRESET = {p["key"]: p for p in meta_h["presets"]}
for tag, req, r in zip("AB", requests, responses):
    ap, ex = r["applied"], r["excluded"]
    check(list(ex["by_primary_reason"]) == RANKS, "rank key order")
    check(sum(ex["by_primary_reason"].values()) == ex["total"], "I1")
    check(r["eligible_total"] + ex["total"] == r["candidates_considered"], "I2")
    check(len(r["results"]) == min(r["eligible_total"], req["limit"]), "I3")
    check(list(ex["allergen_detail"]["by_allergen"]) == ap["avoid"], "by_allergen keys equal avoided codes")
    for code, dims in ex["allergen_detail"]["by_allergen"].items():
        for dim in ("ingredient", "cross_contact"):
            d = dims[dim]
            check(d["present"] + d["possible"] + d["absent"] + d["unknown"] == r["candidates_considered"], "I4")
            check(sum(d["unknown_by_provenance"].values()) == d["unknown"], "I5")
    allergen_excl = sum(ex["by_primary_reason"][k] for k in RANKS[:6])
    exp = ("no_candidates" if r["candidates_considered"] == 0 else "alternatives_found" if r["eligible_total"] > 0
           else "no_verified_alternatives" if allergen_excl > 0 else "no_matching_alternatives")
    check(r["outcome"]["code"] == exp, "outcome rule")
    exp_text = FIXED["outcome." + exp].replace("{n}", str(r["eligible_total"]))
    check(r["outcome"]["text"] == exp_text, "outcome text equals fixed text")
    copies["outcome"] += 1
    check(r["disclaimer"] == FIXED["disclaimer"], "response disclaimer equals fixed text")
    copies["disclaimer"] += 1
    check(ap["allergen_profile_status"] == req["allergen_profile_status"], "profile status echoed")
    check(ap["allergen_filtering"] == ("not_applied" if ap["allergen_profile_status"] == "none_confirmed" else "applied"), "allergen_filtering")
    check((ap["allergen_profile_status"] == "restrictions") == bool(ap["avoid"]), "profile consistent with avoid")
    check(ap["health_goals"] == req["health_goals"], "health goals echoed")
    if ap["allergen_profile_status"] == "none_confirmed":
        check(allergen_excl == 0, "no allergen exclusions without filtering")
    for i, res in enumerate(r["results"]):
        check(res["rank"] == i + 1, "rank sequence")
        f = res["food"]
        st = check_status_map(f["allergen_status"])
        for c in ap["avoid"]:
            check(st[c].ingredient == "absent" and st[c].cross_contact == "absent", "eligible result must be absent/absent")
        codes = [u["code"] for u in res["uncertainty"]]
        check(len(codes) == len(set(codes)), "uncertainty codes unique")
        unc = {u["code"]: u for u in res["uncertainty"]}
        check("preparation_dependent" in unc and "nutrition_unstandardized" in unc, "always-present codes")
        want = {
            "allergen_ingredient_flagged": [c for c in CODES if st[c].ingredient in ("present", "possible")],
            "allergen_ingredient_unverified": [c for c in CODES if st[c].ingredient == "unknown"],
            "allergen_cross_contact_flagged": [c for c in CODES if st[c].cross_contact in ("present", "possible")],
            "allergen_cross_contact_unverified": [c for c in CODES if st[c].cross_contact == "unknown"],
        }
        for code, lst in want.items():
            check((code in unc) == bool(lst), code + " presence")
            if lst:
                check(unc[code]["allergens"] == lst, code + " allergen list")
        q = f["nutrition_quality"]
        listed_fields = q["missing_fields"] + q["invalid_fields"]
        check(("nutrition_incomplete" in unc) == bool(listed_fields), "nutrition_incomplete presence")
        if listed_fields:
            check(unc["nutrition_incomplete"]["fields"] == listed_fields, "nutrition_incomplete fields")
        for fld in listed_fields:
            check(f["nutrition"][fld] is None, "listed field is null")
        check(f["nutrition_basis"]["serving_label_as_stored"] == f["serving_size"], "serving label as stored")
        # fixed uncertainty texts
        flagged = want["allergen_ingredient_flagged"]
        if flagged:
            keyword = all(st[c].ingredient_provenance == "legacy_seed_heuristic" for c in flagged)
            tmpl = FIXED["uncertainty.allergen_ingredient_flagged." + ("keyword" if keyword else "generic")]
            check(unc["allergen_ingredient_flagged"]["text"] == tmpl.replace("{labels}", ", ".join(LABEL[c] for c in flagged)), "flagged text")
            copies["uncertainty"] += 1
        if want["allergen_cross_contact_flagged"]:
            tmpl = FIXED["uncertainty.allergen_cross_contact_flagged"]
            check(unc["allergen_cross_contact_flagged"]["text"] == tmpl.replace("{labels}", ", ".join(LABEL[c] for c in want["allergen_cross_contact_flagged"])), "cc flagged text")
            copies["uncertainty"] += 1
        for code, key in (("allergen_ingredient_unverified", "uncertainty.allergen_ingredient_unverified"),
                          ("allergen_cross_contact_unverified", "uncertainty.allergen_cross_contact_unverified"),
                          ("nutrition_unstandardized", "uncertainty.nutrition_unstandardized"),
                          ("nutrition_incomplete", "uncertainty.nutrition_incomplete")):
            if code in unc:
                check(unc[code]["text"] == FIXED[key], code + " text equals fixed text")
                copies["uncertainty"] += 1
        check(unc["preparation_dependent"]["text"] == FIXED["preparation_warning"], "preparation warning equals fixed text")
        copies["preparation_warning"] += 1
        # reasons: every active preset condition appears, holds, and uses the template
        thr = [(g, fl) for g in ap["health_goals"] for fl in PRESET[g]["filters"]]
        thr_reasons = [x for x in res["reasons"] if x["code"] == "filter_threshold"]
        check([x["field"] for x in thr_reasons] == [fl["field"] for _, fl in thr], "one threshold reason per active condition")
        for x, (_, fl) in zip(thr_reasons, thr):
            stored = f["nutrition"][fl["field"]]
            check(stored is not None and (stored < fl["value"] if fl["op"] == "lt" else stored > fl["value"]), "condition holds")
            exp_reason = (FIXED["reason.filter_threshold"].replace("{field}", fl["field"])
                          .replace("{direction}", "below" if fl["op"] == "lt" else "above")
                          .replace("{value}", str(fl["value"])).replace("{stored}", str(stored)).replace("{unit}", fl["unit"]))
            check(x["text"] == exp_reason, "threshold reason text equals template")
            copies["reason"] += 1
        for x in res["reasons"]:
            if x["code"] in ("category", "swap_group"):
                pat = re.escape(FIXED["reason." + x["code"]]).replace(r"\{original\}", ".+").replace(r"\{category\}", re.escape(f["category"]))
                check(re.fullmatch(pat, x["text"]), "category reason text matches template")
                copies["reason"] += 1
    print("PASS response example", tag, "->", r["outcome"]["code"])
ok("response examples: invariants I1-I5, outcome rule, uncertainty and reason consistency", "2 (A and B)")
ok("fixed-text copies compared for exact equality",
   ", ".join("%s=%d" % kv for kv in sorted(copies.items())))

# any JSON string that starts like a fixed text must be that fixed text
def strings(o):
    if isinstance(o, str):
        yield o
    elif isinstance(o, dict):
        for v in o.values():
            yield from strings(v)
    elif isinstance(o, list):
        for v in o:
            yield from strings(v)


plain = [t for t in FIXED.values() if "{" not in t]
near = 0
for _, obj in parsed:
    for s in strings(obj):
        for t in plain:
            if s != t and len(s) > 30 and s[:25] == t[:25]:
                near += 1
check(near == 0, "near-duplicate variants of fixed texts in JSON examples: %d" % near)
ok("no variant wordings of fixed texts in any JSON example")

# ---------- 8. example D and E ----------
d = by_schema["FoodSchema"][0]
q = d["nutrition_quality"]
for fld in q["missing_fields"] + q["invalid_fields"]:
    check(d["nutrition"][fld] is None, "example D listed field is null")
check(set(q["missing_fields"]).isdisjoint(q["invalid_fields"]), "example D missing/invalid disjoint")
e = check_status_map(by_schema["AllergenStatusMap"][0])
check(all(v.ingredient_provenance == "no_allergen_record" and v.cross_contact_provenance == "no_source" for v in e.values()),
      "example E: no_allergen_record on all 11 codes")
ok("examples D and E consistent", "D nutrition_quality vs nulls; E no_allergen_record on all 11 codes incl. wheat, sesame, sulfites")

# ---------- 9. structure of the document ----------
crit = P3.split("## 5. Acceptance criteria")[1].split("## 6. Implementation order")[0]
nums = [int(n) for n in re.findall(r"^(\d+)\. ", crit, re.M)]
check(nums == list(range(1, 65)), "criteria numbering: %s" % nums)
for line in re.findall(r"^\d+\. .*$", crit, re.M):
    check(re.search(r"[.)]$", line.rstrip()) or line.rstrip().endswith(":"), "criterion does not end cleanly: " + line[:60])
ok("acceptance criteria numbered 1-64, each once, in order, none cut off")

C1 = ("    - C1: the attached source is verified, belongs to this food and explicitly records this allergen as absent, "
      "but `preparation.details_known = false`.")
check(C1 in P3, "C1 text preserved exactly")
c21 = crit.split("\n21. ")[1].split("\n22. ")[0]
check("each expected result is `unknown` with provenance `insufficient_preparation_evidence`" in c21, "C1 expected result")
check(re.findall(r"^    - (C\d):", c21, re.M) == ["C1", "C2", "C3", "C4", "C5"], "C1-C5 present")
ok("C1 preserved verbatim from Rev. 6, with C2-C5 and the expected result")

files_sec = P1.split("## 3. Files")[1]
n_ids = re.findall(r"^- (N\d+) `([^`]+)`", files_sec, re.M)
m_ids = re.findall(r"^- (M\d+) `([^`]+)`", files_sec, re.M)
check([i for i, _ in n_ids] == ["N%d" % i for i in range(1, 24)], "N1-N23")
check([i for i, _ in m_ids] == ["M%d" % i for i in range(1, 14)], "M1-M13")
paths = [p for _, p in n_ids + m_ids]
check(len(set(paths)) == 36, "36 distinct paths")
order = P3.split("## 6. Implementation order")[1].split("Gate commands:")[0]
steps = "\n".join(l for l in order.splitlines() if re.match(r"- Step [1-8] ", l))
used = re.findall(r"\b([NM]\d+)\b", steps)
check(sorted(used) == sorted(i for i, _ in n_ids + m_ids), "steps 1-8 cover each of the 36 files exactly once")
unrendered = re.findall(r"^  - `(frontend/[^`]+)`$", files_sec, re.M)
check(len(unrendered) == 9 and not set(unrendered) & set(paths), "nine unrendered files, none in scope")
ok("file scope", "23 new + 13 modified = 36 distinct paths; steps 1-8 use each exactly once; 9 unrendered files outside scope")

for token in ("…", "...", "heimit", "TODO", "TBD", "APPENDIX_RESULTS"):
    body = ALL if token != "APPENDIX_RESULTS" else P1 + P2
    check(token not in body, "forbidden token present: %r" % token)
ok("no ellipses, placeholders or known corruption markers")

for h in ("### 1.1", "### 1.2", "### 1.3", "### 1.4", "### 1.5", "### 1.6", "### 1.7", "### 2.1", "### 2.2", "### 2.3",
          "### 3.1", "### 3.2", "### 3.3"):
    check(P1.count(h + " ") == 1, "heading " + h)
for i in range(1, 11):
    check(P2.count("### 4.%d " % i) == 1, "heading 4.%d" % i)
for h in ("## 5. ", "## 6. ", "## 7. ", "## Appendix"):
    check(P3.count(h) == 1, "heading " + h)
for t in (P1, P2, P3):
    check(t.count("```") % 2 == 0, "unbalanced code fences")
for sec in ("Batch 2 (recommended first):",):
    b2 = P3.split(sec)[1].split("Code and data leftovers:")[0]
    check("Legacy boolean API cleanup" in b2 and "Sustainability NaN issue" in b2, "Batch 2 backlog items")
ok("section headings 1.1-1.7, 2.1-2.3, 3.1-3.3, 4.1-4.10, 5, 6, 7, Appendix each present once; fences balanced; Batch 2 items present")

print()
print("SUMMARY json_blocks=%d response_examples_schema_validated=%d all_examples_schema_validated=%d checks_passed=%d"
      % (len(parsed), len(responses), len(parsed), len(RESULTS)))
print("fences per part:", fence_count)
print("sizes (chars):", len(P1), len(P2), len(P3))
