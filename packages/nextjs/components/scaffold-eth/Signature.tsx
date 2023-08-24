import { useState } from "react";
import { CopyToClipboard } from "react-copy-to-clipboard";
import { CheckCircleIcon, DocumentDuplicateIcon } from "@heroicons/react/24/outline";

type TSignatureProps = {
  signature?: string;
  format?: "short" | "long";
  size?: "xs" | "sm" | "base" | "lg" | "xl" | "2xl" | "3xl";
};

export const Signature = ({ signature, format, size = "base" }: TSignatureProps) => {
  const [signatureCopied, setSignatureCopied] = useState(false);

  // Skeleton UI
  if (!signature) {
    return (
      <div className="animate-pulse flex space-x-4">
        <div className="rounded-md bg-slate-300 h-6 w-6"></div>
        <div className="flex items-center space-y-6">
          <div className="h-2 w-28 bg-slate-300 rounded"></div>
        </div>
      </div>
    );
  }

  let displaySignature = signature?.slice(0, 5) + "..." + signature?.slice(-4);

  if (format === "long") displaySignature = signature;

  return (
    <div className="flex items-center">
      <div className="flex-shrink-0 font-bold">Signature:</div>
      <span className={`ml-1.5 text-${size} font-normal`}>{displaySignature}</span>
      {signatureCopied ? (
        <CheckCircleIcon
          className="ml-1.5 text-xl font-normal text-sky-600 h-5 w-5 cursor-pointer"
          aria-hidden="true"
        />
      ) : (
        <CopyToClipboard
          text={signature}
          onCopy={() => {
            setSignatureCopied(true);
            setTimeout(() => {
              setSignatureCopied(false);
            }, 800);
          }}
        >
          <DocumentDuplicateIcon
            className="ml-1.5 text-xl font-normal text-sky-600 h-5 w-5 cursor-pointer"
            aria-hidden="true"
          />
        </CopyToClipboard>
      )}
    </div>
  );
};
