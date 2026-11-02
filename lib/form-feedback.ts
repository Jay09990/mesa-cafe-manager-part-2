import type { FormEvent } from "react";

// Maps a server validation message to the most likely field and moves focus there.
export function focusFormField(form: HTMLFormElement, message: string) {
  const text = message.toLowerCase();
  const candidates: Array<[RegExp, string]> = [
    [/email/, "email"], [/password/, "password"], [/name|café|cafe/, "tenantName"], [/web address|slug|url/, "slug"],
    [/phone/, "phone"], [/party|capacity|seat/, "partySize"], [/date|sales date/, "date"], [/time|slot|opening hours/, "time"],
    [/price|amount|sales|order count/, "price"], [/category/, "category"], [/dietary|type/, "dietaryType"], [/timezone/, "timezone"], [/currency/, "currency"],
  ];
  const match = candidates.find(([pattern]) => pattern.test(text));
  const target = match ? form.elements.namedItem(match[1]) : null;
  if (target instanceof HTMLElement) { target.focus(); return; }
  const invalid = form.querySelector<HTMLElement>(":invalid");
  if (invalid) { invalid.focus(); return; }
  (form.querySelector<HTMLElement>("input:not([type=checkbox]), select, textarea") ?? form).focus();
}

export function submitForm(form: HTMLFormElement, submit: (data: FormData, form: HTMLFormElement) => void | Promise<void>) {
  return (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void submit(new FormData(form), form);
  };
}
