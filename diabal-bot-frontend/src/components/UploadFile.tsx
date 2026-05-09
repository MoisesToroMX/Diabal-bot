import {
  Card,
  Button,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
  Image,
} from "@heroui/react";
import { ArrowUpTrayIcon } from "@heroicons/react/24/solid";
import { useRef, useState, useCallback } from "react";

import { images } from "@/variables/data";
import {
  acceptedProductFileExtensions,
  formatFileSize,
  isAcceptedProductFile,
} from "@/lib/files";

type UploadButtonProps = {
  label?: string;
  color?:
    | "primary"
    | "secondary"
    | "success"
    | "warning"
    | "danger"
    | "default";
  size?: "sm" | "md" | "lg";
  onPress?: () => void;
  isDisabled?: boolean;
  isLoading?: boolean;
};

type UploadAreaProps = {
  onFileAccepted?: (file: File | null) => void;
};

type UploadFileProps = {
  onFileUpload?: (file: File) => Promise<void> | void;
};

function UploadArea({ onFileAccepted }: UploadAreaProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [newFile, setNewFile] = useState<File | null>(null);

  const acceptedFormats = acceptedProductFileExtensions.join(",");

  const handleFile = useCallback(
    (selectedFile: File | null) => {
      setError(null);

      if (!selectedFile) return;

      if (!isAcceptedProductFile(selectedFile.name)) {
        setError("Invalid format. Only CSV and XLSX files are allowed.");
        onFileAccepted?.(null);
        setNewFile(null);

        return;
      }

      onFileAccepted?.(selectedFile);
      setNewFile(selectedFile);
    },
    [onFileAccepted],
  );

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFile(e.target.files?.[0] ?? null);

    e.currentTarget.value = "";
  };
  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();

    handleFile(e.dataTransfer.files?.[0] ?? null);
  };
  const onDragOver = (e: React.DragEvent) => e.preventDefault();

  return (
    <Card
      className="relative p-4 text-center bg-zinc-600/10 "
      onDragOver={onDragOver}
      onDrop={onDrop}
    >
      <input
        ref={inputRef}
        accept={acceptedFormats}
        aria-label="Select a file"
        className="absolute inset-0 z-10 h-full w-full cursor-pointer opacity-0"
        type="file"
        onChange={onChange}
      />

      <div className="flex justify-center">
        <Image
          isBlurred
          alt="Click to select a file"
          className="pointer-events-none"
          height={200}
          src={images.upload}
          width={200}
        />
      </div>

      <div className="mt-3 text-sm text-zinc-300">
        {error ? (
          <div className="mt-2 text-red-400">{error}</div>
        ) : newFile ? (
          <div className="mt-2">
            <span className="font-medium text-white">Selected:</span>{" "}
            {newFile.name}{" "}
            <span className="text-zinc-400">
              ({formatFileSize(newFile.size)})
            </span>
          </div>
        ) : (
          <>
            <p>Click (or drag & drop) to select a file</p>
            <span className="text-zinc-400">Accepted formats: CSV, XLSX</span>
          </>
        )}
      </div>
    </Card>
  );
}

function UploadButton({
  label = "Upload",
  color = "primary",
  size = "sm",
  onPress,
  isDisabled = false,
  isLoading = false,
}: UploadButtonProps) {
  return (
    <Button
      className="w-full"
      color={color}
      endContent={<ArrowUpTrayIcon className="size-4" />}
      isDisabled={isDisabled}
      isLoading={isLoading}
      size={size}
      variant="flat"
      onPress={onPress}
    >
      {label}
    </Button>
  );
}

function UploadFile({ onFileUpload }: UploadFileProps) {
  const { isOpen, onOpen, onOpenChange, onClose } = useDisclosure();
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleSend = async () => {
    if (!file) return;

    setIsUploading(true);

    try {
      await onFileUpload?.(file);
      setFile(null);
      onClose();
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <>
      <UploadButton color="primary" label="Upload File" onPress={onOpen} />

      <Modal backdrop="blur" isOpen={isOpen} onOpenChange={onOpenChange}>
        <ModalContent>
          {() => (
            <>
              <ModalHeader className="flex flex-col gap-1">
                Select your file
              </ModalHeader>
              <ModalBody>
                <UploadArea onFileAccepted={setFile} />
              </ModalBody>

              <ModalFooter>
                <UploadButton
                  isDisabled={!file || isUploading}
                  isLoading={isUploading}
                  label="Send"
                  onPress={handleSend}
                />
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </>
  );
}

export { UploadFile };
