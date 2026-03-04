/**
 * Computes the result of going back one step in a sequential form.
 * Returns { step, input } for the previous field, or null if already at first field.
 */
export function goBack(step, fields, values) {
  if (step <= 0) return null;
  const prevStep = step - 1;
  const prevKey = typeof fields[prevStep] === 'string' ? fields[prevStep] : fields[prevStep].key;
  return { step: prevStep, input: values[prevKey] || '' };
}
