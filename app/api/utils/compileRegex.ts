/**
 * maskToRegex — converts a OneEntry input mask into a regex source string.
 *
 * @param   {string} mask - Mask using the OneEntry tokens (`9` digit, `A` upper, `a` lower, `*` alnum, `$` punctuation, `[[space]]`).
 * @returns Regex source string with mask tokens substituted by character classes.
 */
function maskToRegex(mask: string) {
  const maskRules: { [key: string]: string } = {
    '\\[\\[space\\]\\]': '\\s',
    '\\$': '[\\(\\)\\-\\+]',
    '9': '\\d',
    A: '[A-Z]',
    a: '[a-z]',
    '\\*': '[\\dA-Za-z]',
  };

  let regexPattern = mask.toString();

  // eslint-disable-next-line no-restricted-syntax
  for (const key in maskRules) {
    const regex = new RegExp(key, 'g');
    regexPattern = regexPattern.replace(regex, maskRules[key] ?? '');
  }
  return regexPattern;
}

/**
 * compileRegex — compiles a OneEntry input mask into an anchored `RegExp`.
 *
 * @param   {string} mask - Mask string using the OneEntry tokens.
 * @returns Anchored `RegExp` that fully matches input conforming to the mask.
 */
export function compileRegex(mask: string) {
  const regexPattern = maskToRegex(mask);
  return new RegExp(`^${regexPattern}$`);
}
