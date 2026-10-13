// The small "what is this figure" marker beside a KPI label. Native `title` is
// the whole tooltip — no popover library, no hover state to manage — and the
// same string is the accessible name, so a screen reader gets the definition a
// pointer user gets on hover.
export function InfoTip({ text }: { text: string }) {
  return <i className="las la-info-circle info-tip" role="img" aria-label={text} title={text} />;
}
