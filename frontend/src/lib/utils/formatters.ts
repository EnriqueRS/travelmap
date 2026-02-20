export function formatDate(dateInput: string | Date | null | undefined): string {
  if (!dateInput) return '';

  let d: Date;

  // Si viene como string 'YYYY-MM-DD' nativo purista sin ISO Timezone
  if (typeof dateInput === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateInput)) {
    const [year, month, day] = dateInput.split('-');
    return `${day}/${month}/${year}`;
  }

  // De lo contrario parseamos como ISO
  d = new Date(dateInput);

  if (isNaN(d.getTime())) return String(dateInput);

  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();

  return `${dd}/${mm}/${yyyy}`;
}
