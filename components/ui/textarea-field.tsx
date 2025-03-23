import { cn } from "@/lib/utils";
import get from "lodash/get";
import type { ComponentPropsWithRef } from "react";
import { useId } from "react";
import { Label } from "./label";
import { Textarea } from "./textarea";

export interface InputFieldProps extends ComponentPropsWithRef<"textarea"> {
  label: string;
  name: string;
  errors?: Record<string, string> | null;
  inputClassName?: string;
}

const TextareaField = ({
  errors,
  name,
  label,
  className,
  inputClassName,
  ...props
}: InputFieldProps) => {
  const reactId = useId();
  const id = props.id || reactId;
  const errorMessage = get(errors, name);

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <Label htmlFor={id}>{label}</Label>

      <Textarea
        id={id}
        name={name}
        className={cn("input w-full", inputClassName)}
        {...props}
      />

      {errorMessage && <p className="text-red-500">{errorMessage}</p>}
    </div>
  );
};

export { TextareaField };
