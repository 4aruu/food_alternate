// Shared look for allergen and filter toggles (aria-pressed buttons) on the
// nutrition explorer and the registration form, so selection reads the same
// on both pages.

// Selected look is keyed on aria-pressed, so it cannot drift from the accessible
// state. Fill plus a 3px border: the border width survives forced-colours mode
// and dark-mode extensions, which recolour fills. Violet is outside the brand
// palette and is not green. Each chip trims its own padding by the extra border
// width so selecting does not shift the layout.
export const PRESSED_CHIP =
  'aria-pressed:bg-violet-300 aria-pressed:text-black aria-pressed:border-white aria-pressed:border-[3px]';

// Keyboard focus: a dashed yellow outline drawn 2px outside the chip, so it differs
// from the selected border in colour, line style and position. An outline (not a
// box-shadow ring) because forced-colours mode removes box-shadows. ring-0 and
// ring-offset-0 cancel the default ring on the shared Button.
export const FOCUS_RING =
  'focus-visible:outline-2 focus-visible:outline-dashed focus-visible:outline-offset-2 focus-visible:outline-yellow-300 focus-visible:ring-0 focus-visible:ring-offset-0';
