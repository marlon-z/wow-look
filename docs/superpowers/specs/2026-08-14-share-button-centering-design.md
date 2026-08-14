# Share button centering design

## Goal

Keep the share-panel call-to-action label visually centered in its fixed-size WeChat Mini Program button.

## Change

Use flexbox centering on `.home-share-panel-button`, reset its padding, and remove the fixed line-height. The button's dimensions, typography, gradient, and `open-type="share"` behavior remain unchanged.

## Validation

The WXSS syntax check confirms the rule is valid; manual DevTools preview confirms horizontal and vertical centering.
