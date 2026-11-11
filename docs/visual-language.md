# Last Light visual language

Last Light is presented as a keeper's maritime logbook, with a navigational chart underneath the action. The UI borrows from engraved lighthouse plates, brass instruments, chart margins and handwritten journal records.

## Foundations

- **Night:** `#07131e` for the sea after sunset.
- **Weathered teal:** `#164759` for depth, water and secondary surfaces.
- **Brass:** `#b99b67` for instrument borders, navigation marks and separators.
- **Lamplight:** `#ffd58a` for interactive highlights and the lighthouse beam.
- **Paper:** `#fff1d6` for primary copy and warm illustration details.
- **Warning coral:** `#ef786c` for danger, damage and destructive actions.

The serif display style belongs to the narrative and navigational surfaces. The restrained sans-serif supports controls, meters and compact labels. Decorative marks are kept away from small interactive targets.

## Interface treatments

- **Title:** an engraved lighthouse illustration and a brass-framed logbook cover. The primary action remains prominent.
- **Night chart:** numbered watch entries with unlock state, title and short descriptions.
- **Logbook:** numbered entries and readable prose; discovered text takes priority over decoration.
- **Lamp room:** a brass instrument motif and compact equipment rows.
- **Gameplay:** quiet compass bearings beneath the play field with traditional instrument-style meters above it.

## Interaction

Keep menu controls as semantic HTML buttons. Preserve keyboard input, the high-contrast toggle and the reduced-motion setting. Atmospheric animation must never encode game state on its own. Do not move the playable arena or change gameplay rules to accommodate decorative art.

The game uses standard Canvas 2D and local HTML/CSS. It does not load remote fonts or image assets; both the illustration and the navigational chart are drawn or stored locally.
