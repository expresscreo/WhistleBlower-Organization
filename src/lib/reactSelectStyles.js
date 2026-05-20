const insetBorder = 'inset 0 0 0 1px hsl(var(--input))';
const insetFocus = 'inset 0 0 0 2px hsl(var(--primary))';

export const reactSelectStyles = {
  container: (base) => ({
    ...base,
    width: '100%',
  }),
  control: (base, state) => ({
    ...base,
    minHeight: 48,
    borderRadius: '0.375rem',
    borderColor: 'transparent',
    backgroundColor: 'hsl(var(--background))',
    boxShadow: state.isFocused ? insetFocus : insetBorder,
    '&:hover': {
      borderColor: 'transparent',
      boxShadow: state.isFocused ? insetFocus : insetBorder,
    },
  }),
  valueContainer: (base) => ({
    ...base,
    padding: '0 12px',
  }),
  input: (base) => ({
    ...base,
    margin: 0,
    padding: 0,
    color: 'hsl(var(--foreground))',
  }),
  placeholder: (base) => ({
    ...base,
    color: 'hsl(var(--muted-foreground))',
  }),
  singleValue: (base) => ({
    ...base,
    color: 'hsl(var(--foreground))',
  }),
  menu: (base) => ({
    ...base,
    borderRadius: '0.75rem',
    overflow: 'hidden',
    marginTop: 4,
    backgroundColor: 'hsl(var(--popover))',
    border: '1px solid hsl(var(--border))',
    boxShadow:
      '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
  }),
  menuPortal: (base) => ({
    ...base,
    zIndex: 9999,
  }),
  menuList: (base) => ({
    ...base,
    maxHeight: 240,
    padding: 4,
  }),
  option: (base, state) => ({
    ...base,
    borderRadius: '0.375rem',
    padding: '10px 12px',
    backgroundColor: state.isSelected
      ? 'hsl(var(--primary))'
      : state.isFocused
        ? 'hsl(var(--accent))'
        : 'transparent',
    color: state.isSelected
      ? 'hsl(var(--primary-foreground))'
      : 'hsl(var(--foreground))',
    cursor: 'pointer',
  }),
  indicatorSeparator: () => ({ display: 'none' }),
};

/** Use with menuPortalTarget={document.body} and menuPosition="fixed" */
export function getReactSelectPortalProps() {
  if (typeof document === 'undefined') {
    return { menuPortalTarget: null, menuPosition: 'absolute' };
  }
  return {
    menuPortalTarget: document.body,
    menuPosition: 'fixed',
  };
}
