import {
  forwardRef,
  useId,
  type InputHTMLAttributes,
  type ReactNode,
  type Ref,
  type TextareaHTMLAttributes,
} from "react";

type SharedProps = {
  label?: string;
  hint?: string;
  error?: string;
  prefixIcon?: ReactNode;
  suffixIcon?: ReactNode;
  fullWidth?: boolean;
};

export type TextFieldProps = SharedProps &
  Omit<InputHTMLAttributes<HTMLInputElement>, "prefix"> & {
    multiline?: false;
  };

export type TextAreaFieldProps = SharedProps &
  TextareaHTMLAttributes<HTMLTextAreaElement> & {
    multiline: true;
  };

const fieldShell =
  "flex w-full items-center gap-2 rounded-[10px] border bg-white px-4 py-3 text-[15px] text-[var(--foreground,#171717)] transition-colors " +
  "placeholder:text-[#BDBDBD] " +
  "focus-within:outline-none focus-within:ring-0 " +
  "disabled:cursor-not-allowed disabled:opacity-60";

function FieldChrome({
  id,
  label,
  hint,
  error,
  prefixIcon,
  suffixIcon,
  fullWidth,
  disabled,
  children,
}: {
  id: string;
  label?: string;
  hint?: string;
  error?: string;
  prefixIcon?: ReactNode;
  suffixIcon?: ReactNode;
  fullWidth?: boolean;
  disabled?: boolean;
  children: ReactNode;
}) {
  const borderClass = error
    ? "border-red-500 focus-within:border-red-600 focus-within:border-2"
    : "border-[var(--gopoli-border,#E0E0E0)] focus-within:border-[var(--gopoli-primary,#1B5E20)] focus-within:border-2";

  return (
    <div className={fullWidth !== false ? "w-full" : undefined}>
      {label ? (
        <label
          htmlFor={id}
          className="mb-1.5 block text-sm font-medium text-[var(--gopoli-text-muted,#757575)]"
        >
          {label}
        </label>
      ) : null}
      <div
        className={[fieldShell, borderClass, disabled ? "opacity-60" : ""].join(
          " ",
        )}
      >
        {prefixIcon ? (
          <span
            className="shrink-0 text-[var(--gopoli-text-muted,#757575)]"
            aria-hidden
          >
            {prefixIcon}
          </span>
        ) : null}
        {children}
        {suffixIcon ? (
          <span className="shrink-0" aria-hidden>
            {suffixIcon}
          </span>
        ) : null}
      </div>
      {error ? (
        <p id={`${id}-error`} role="alert" className="mt-1.5 text-sm text-red-600">
          {error}
        </p>
      ) : hint ? (
        <p
          id={`${id}-hint`}
          className="mt-1.5 text-sm text-[var(--gopoli-text-muted,#757575)]"
        >
          {hint}
        </p>
      ) : null}
    </div>
  );
}

export const TextField = forwardRef<
  HTMLInputElement | HTMLTextAreaElement,
  TextFieldProps | TextAreaFieldProps
>(function TextField(props, ref) {
  const autoId = useId();
  const {
    label,
    hint,
    error,
    prefixIcon,
    suffixIcon,
    fullWidth = true,
    className = "",
    id: idProp,
    disabled,
    ...rest
  } = props;
  const id = idProp ?? autoId;
  const describedBy = error ? `${id}-error` : hint ? `${id}-hint` : undefined;
  const inputClass =
    "min-w-0 flex-1 border-0 bg-transparent p-0 outline-none focus:ring-0 " +
    className;

  if ("multiline" in props && props.multiline) {
    const { multiline: _multiline, ...textareaRest } =
      rest as TextareaHTMLAttributes<HTMLTextAreaElement> & {
        multiline?: true;
      };
    void _multiline;
    return (
      <FieldChrome
        id={id}
        label={label}
        hint={hint}
        error={error}
        prefixIcon={prefixIcon}
        suffixIcon={suffixIcon}
        fullWidth={fullWidth}
        disabled={disabled}
      >
        <textarea
          ref={ref as Ref<HTMLTextAreaElement>}
          id={id}
          disabled={disabled}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className={`${inputClass} min-h-[96px] resize-y`}
          {...textareaRest}
        />
      </FieldChrome>
    );
  }

  const inputRest = rest as InputHTMLAttributes<HTMLInputElement>;
  return (
    <FieldChrome
      id={id}
      label={label}
      hint={hint}
      error={error}
      prefixIcon={prefixIcon}
      suffixIcon={suffixIcon}
      fullWidth={fullWidth}
      disabled={disabled}
    >
      <input
        ref={ref as Ref<HTMLInputElement>}
        id={id}
        disabled={disabled}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className={inputClass}
        {...inputRest}
      />
    </FieldChrome>
  );
});
