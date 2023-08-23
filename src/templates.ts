export type Template = {
  markdown: string;
  org: string;
};

export const defaultHighlightTemplate: Template = {
  markdown: `> {{{text}}}

{{{note}}}`,
  org: `#+BEGIN_QUOTE
{{text}}
#+END_QUOTE

{{note}}`,
};

export const defaultBookmarkTemplate: Template = {
  markdown: `[{{{title}}}]({{{url}}})
title:: {{{title}}}
url:: {{{url}}}
Tags:: {{{tags}}}
date-saved:: [[{{{dateCreated}}}]]`,
  org: `[[{{{url}}}][{{{title}}}]]
:PROPERTIES:
:title: {{{title}}}
:url: {{{url}}}
:Tags: {{{tags}}}
:date-saved: [[{{{dateCreated}}}]]
:END:`,
};

export const defaultSavedToRaindropTemplate: Template = {
  markdown: `Saved to Raindrop: 
{{{#links}}}
{{{.}}}
{{{/links}}}`,
  org: `Saved to Raindrop:
{{{#links}}}
{{{.}}}
{{{/links}}}`,
};
