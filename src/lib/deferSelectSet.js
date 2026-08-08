// Radix's <Select>, when rendered inside a <form>, keeps a visually-hidden
// native <select> in sync with its controlled value (see
// @radix-ui/react-select's SelectBubbleInput — it exists for browser
// autofill/native form semantics). On mount, before the trigger's ref has
// attached, Radix can't yet tell whether it's inside a form, so it assumes
// it is. That triggers a sync effect which writes the current value onto the
// native mirror and dispatches a real DOM "change" event to read it back —
// and at that instant, if our own value-setting effect runs in the same
// commit, the native mirror hasn't been told about it yet, so the event
// reports empty and stomps whatever we just set.
//
// Proven by instrumenting the actual setter: a value set synchronously in an
// effect is silently reset to "" one render later, with the reset call
// stack pointing into Radix's own bundle, not our code. Deferring the set by
// two animation frames — past the browser's next two paints — runs it after
// that mount-time sync has settled, and the reset does not recur.
//
// Symptom if this is skipped: a Select pre-populated with a real value (e.g.
// "ride the whole line by default", or an edit dialog seeding a station from
// an existing record) shows its placeholder instead, and anything computed
// from that value (a fare preview, a distance) silently comes out empty.
export function deferSelectSet(fn) {
  requestAnimationFrame(() => requestAnimationFrame(fn));
}
