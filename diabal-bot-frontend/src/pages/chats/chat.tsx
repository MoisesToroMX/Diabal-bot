import {
  FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useParams } from "react-router-dom";
import {
  Avatar,
  Button,
  Card,
  Chip,
  Divider,
  Input,
  User,
} from "@heroui/react";
import {
  ArrowDownTrayIcon,
  ArrowUpIcon,
  CloudArrowUpIcon,
} from "@heroicons/react/24/solid";

import {
  getDownloadUrl,
  getSession,
  uploadProductFile,
} from "@/helpers/uploader";
import { formatFileSize, isAcceptedProductFile } from "@/lib/files";
import { getSessionSummary } from "@/lib/session";
import { getSocket } from "@/socketClient";
import { UploadFile } from "@/components/UploadFile";
import { images } from "@/variables/data";
import { Msg, MessageRowProps, ProductRecord, SessionData } from "@/types";

const seed: Record<string, Msg[]> = {
  "1": [],
};

function makeLocalMessage(from: Msg["from"], text: string): Msg {
  return {
    id: crypto.randomUUID(),
    from,
    text,
    at: new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    }),
  };
}

function PreviewTable({ product }: { product?: ProductRecord }) {
  if (!product) {
    return <p className="text-xs text-zinc-400">No rows loaded.</p>;
  }

  return (
    <div className="max-h-60 overflow-auto rounded-lg border border-zinc-700">
      <table className="w-full text-left text-xs">
        <tbody>
          {Object.entries(product).map(([key, value]) => (
            <tr key={key} className="border-b border-zinc-800 last:border-b-0">
              <th className="w-44 bg-zinc-900/60 px-3 py-2 text-zinc-300">
                {key}
              </th>
              <td className="px-3 py-2 text-zinc-100">{value || "-"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function MappingPanel({
  chatId,
  session,
}: {
  chatId: string;
  session: SessionData | null;
}) {
  const openDownload = useCallback(() => {
    if (!session) return;

    window.open(getDownloadUrl(chatId), "_blank", "noopener,noreferrer");
  }, [chatId, session]);

  if (!session) {
    return (
      <Card className="min-h-40 shrink-0 bg-zinc-800/70 p-4 text-zinc-200 xl:w-[clamp(320px,24vw,420px)]">
        <h2 className="text-sm font-semibold">Workflow</h2>
        <div className="mt-3 space-y-2 text-sm text-zinc-300">
          <p>1. Upload a CSV or XLSX product file.</p>
          <p>2. Review the detected JSON field mapping.</p>
          <p>3. Edit values with chat commands.</p>
          <p>4. Confirm and download the final JSON.</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="shrink-0 overflow-hidden bg-zinc-800/70 text-zinc-100 xl:w-[clamp(320px,24vw,420px)]">
      <div className="space-y-3 p-4">
        <div>
          <p className="text-xs uppercase tracking-wide text-zinc-400">File</p>
          <h2 className="break-words text-sm font-semibold">
            {session.originalFileName}
          </h2>
        </div>

        <div className="flex flex-wrap gap-2">
          <Chip color="primary" size="sm" variant="flat">
            {session.rowCount} products
          </Chip>
          <Chip size="sm" variant="flat">
            Header row {session.headerRow}
          </Chip>
          {session.confirmedAt && (
            <Chip color="success" size="sm" variant="flat">
              Confirmed
            </Chip>
          )}
        </div>

        {session.warnings.length > 0 && (
          <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3">
            <p className="text-xs font-semibold text-amber-200">Warnings</p>
            <ul className="mt-1 space-y-1 text-xs text-amber-100">
              {session.warnings.map((warning) => (
                <li key={warning}>{warning}</li>
              ))}
            </ul>
          </div>
        )}

        <Button
          className="w-full"
          color="primary"
          startContent={<ArrowDownTrayIcon className="size-4" />}
          variant="flat"
          onPress={openDownload}
        >
          Download final JSON
        </Button>
      </div>

      <Divider />

      <div className="max-h-56 overflow-auto p-4 xl:max-h-[34dvh]">
        <h3 className="mb-2 text-sm font-semibold">Field mapping</h3>
        <div className="space-y-2">
          {session.mappings.map((mapping) => (
            <div
              key={mapping.field}
              className="rounded-lg border border-zinc-700 p-2"
            >
              <div className="flex items-start justify-between gap-2">
                <span className="text-xs font-semibold">{mapping.field}</span>
                <Chip
                  color={mapping.sourceColumn ? "success" : "warning"}
                  size="sm"
                  variant="flat"
                >
                  {mapping.sourceColumn ? `${mapping.confidence}` : "missing"}
                </Chip>
              </div>
              <p className="mt-1 text-xs text-zinc-400">
                {mapping.sourceColumn || "No source column detected"}
              </p>
            </div>
          ))}
        </div>
      </div>

      <Divider />

      <div className="p-4">
        <h3 className="mb-2 text-sm font-semibold">First row preview</h3>
        <PreviewTable product={session.products[0]} />
      </div>
    </Card>
  );
}

function MessageRow({ msg, isMine, showAvatar }: MessageRowProps) {
  const base =
    "max-w-[88%] break-words whitespace-pre-wrap px-3 py-2 text-sm shadow-sm md:max-w-[75%] md:px-4";
  const mine = "bg-sky-500 text-white rounded-2xl";
  const theirs = "bg-zinc-700 text-zinc-100 rounded-2xl";

  return (
    <div
      className={`flex ${isMine ? "justify-end" : "justify-start"} items-end gap-2`}
    >
      {!isMine && showAvatar && (
        <Avatar
          className="min-w-8 self-end"
          radius="full"
          size="sm"
          src={images.diabal}
        />
      )}

      <Card className={`${base} ${isMine ? mine : theirs}`}>{msg.text}</Card>
    </div>
  );
}

export default function ChatView() {
  const { chatId = "1" } = useParams();
  const [messages, setMsgs] = useState<Msg[]>(seed[chatId] ?? []);
  const [sessionData, setSessionData] = useState<SessionData | null>(null);
  const [text, setText] = useState("");
  const [isDraggingFile, setIsDraggingFile] = useState(false);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const dragDepthRef = useRef(0);

  const socket = useMemo(
    () => getSocket({ userId: "admin-1", name: "Admin" }),
    [],
  );

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    getSession(chatId)
      .then(setSessionData)
      .catch(() => setSessionData(null));
  }, [chatId]);

  useEffect(() => {
    const onServerMessage = (msg: Msg) => {
      if (msg.session) setSessionData(msg.session);

      setMsgs((currentMessages) => {
        const exists = currentMessages.some(({ id }) => id === msg.id);

        return exists ? currentMessages : [...currentMessages, msg];
      });
    };

    socket.emit("room:join", { room: chatId });
    socket.on("message:new", onServerMessage);

    return () => {
      socket.emit("room:leave", { room: chatId });
      socket.off("message:new", onServerMessage);
    };
  }, [socket, chatId]);

  const handleFileUpload = async (file: File) => {
    if (!isAcceptedProductFile(file.name)) {
      setMsgs((currentMessages) => [
        ...currentMessages,
        makeLocalMessage(
          "bot",
          "Invalid format. Only CSV and XLSX files are allowed.",
        ),
      ]);

      return;
    }

    const uploadMessage = makeLocalMessage(
      "admin",
      `Uploaded file: ${file.name} (${formatFileSize(file.size)})`,
    );

    setMsgs((currentMessages) => [...currentMessages, uploadMessage]);

    try {
      const uploadedSession = await uploadProductFile(file, chatId);

      setSessionData(uploadedSession);
      setMsgs((currentMessages) => [
        ...currentMessages,
        makeLocalMessage("bot", getSessionSummary(uploadedSession)),
      ]);
    } catch (error) {
      setMsgs((currentMessages) => [
        ...currentMessages,
        makeLocalMessage(
          "bot",
          error instanceof Error
            ? error.message
            : "Upload failed. Check file format and try again.",
        ),
      ]);
    }
  };

  const handleDragEnter = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    dragDepthRef.current += 1;

    if (event.dataTransfer.types.includes("Files")) {
      setIsDraggingFile(true);
    }
  };

  const handleDragLeave = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    dragDepthRef.current = Math.max(0, dragDepthRef.current - 1);

    if (dragDepthRef.current === 0) {
      setIsDraggingFile(false);
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "copy";
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    dragDepthRef.current = 0;
    setIsDraggingFile(false);

    const file = event.dataTransfer.files?.[0];

    if (file) void handleFileUpload(file);
  };

  const sendMessage = (e: FormEvent) => {
    e.preventDefault();

    const trimmedText = text.trim();

    if (!trimmedText) return;

    const optimisticMessage = makeLocalMessage("admin", trimmedText);

    setMsgs((currentMessages) => [...currentMessages, optimisticMessage]);
    setText("");

    socket.emit(
      "message:send",
      { room: chatId, text: trimmedText, at: optimisticMessage.at },
      (confirmation: { ok: boolean; id?: string; error?: string }) => {
        if (!confirmation?.ok) {
          setMsgs((currentMessages) =>
            currentMessages.map((message) =>
              message.id === optimisticMessage.id
                ? { ...message, text: `${message.text} (not sent)` }
                : message,
            ),
          );

          return;
        }

        setMsgs((currentMessages) => {
          const serverId = confirmation.id!;
          const alreadyExists = currentMessages.some(
            ({ id }) => id === serverId,
          );

          if (alreadyExists) {
            return currentMessages.filter(
              ({ id }) => id !== optimisticMessage.id,
            );
          }

          return currentMessages.map((message) =>
            message.id === optimisticMessage.id
              ? { ...message, id: serverId }
              : message,
          );
        });
      },
    );
  };

  return (
    <div className="grid min-h-full w-full min-w-0 grid-cols-1 gap-2 md:gap-3 xl:h-full xl:grid-cols-[minmax(0,1fr)_auto]">
      <Card
        className="relative flex min-h-[58dvh] min-w-0 flex-col bg-zinc-800/70 md:min-h-[70dvh] xl:h-full xl:min-h-0"
        data-testid="chat-drop-zone"
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        {isDraggingFile && (
          <div className="pointer-events-none absolute inset-2 z-20 flex items-center justify-center rounded-2xl border-2 border-dashed border-sky-400 bg-sky-500/15 text-sky-100 backdrop-blur-sm">
            <div className="flex flex-col items-center gap-3 rounded-2xl bg-zinc-950/80 px-6 py-5 text-center shadow-xl">
              <CloudArrowUpIcon className="size-10" />
              <div>
                <p className="text-base font-semibold">Drop file to upload</p>
                <p className="text-xs text-sky-100/80">CSV or XLSX</p>
              </div>
            </div>
          </div>
        )}

        <div className="flex w-full items-center gap-3 px-3 py-3 md:px-4">
          <User
            avatarProps={{ src: images.diabal }}
            className="font-semibold"
            description="Excel to JSON agent"
            name="Diabal"
          />
        </div>

        <Divider />

        <div className="min-h-0 flex-1 space-y-2 overflow-y-auto px-3 py-3 md:px-4">
          {messages.map((message) => (
            <MessageRow
              key={message.id}
              isMine={message.from === "admin"}
              msg={message}
              showAvatar={message.from === "bot"}
            />
          ))}

          <div ref={bottomRef} />
        </div>

        <Divider />

        <form className="p-2 md:p-3" onSubmit={sendMessage}>
          <UploadFile onFileUpload={handleFileUpload} />

          <div className="mt-3 flex items-center gap-2 rounded-2xl bg-zinc-100/10 px-2 py-2 md:px-3">
            <Input
              classNames={{
                inputWrapper: "bg-transparent shadow-none",
                input: "text-zinc-200 placeholder:text-zinc-400",
              }}
              placeholder="Try: set row 2 supplier_email to qa@example.com"
              radius="lg"
              value={text}
              variant="flat"
              onChange={(e) => setText(e.target.value)}
            />

            <Button
              isIconOnly
              color="primary"
              isDisabled={!text.trim()}
              radius="full"
              size="sm"
              type="submit"
            >
              <ArrowUpIcon className="size-5" />
            </Button>
          </div>
        </form>
      </Card>

      <MappingPanel chatId={chatId} session={sessionData} />
    </div>
  );
}
