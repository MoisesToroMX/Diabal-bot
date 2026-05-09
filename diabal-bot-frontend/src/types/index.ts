type Sender = "admin" | "bot";

type FieldMapping = {
  field: string;
  label: string;
  description: string;
  sourceColumn: string | null;
  sourceIndex: number | null;
  confidence: number;
  isDynamic?: boolean;
};

export type ProductRecord = Record<string, string>;

export type SessionData = {
  ok: boolean;
  sessionId: string;
  originalFileName: string;
  uploadedAt: string;
  confirmedAt: string | null;
  products: ProductRecord[];
  mappings: FieldMapping[];
  warnings: string[];
  headerRow: number;
  rowCount: number;
  downloadUrl: string;
};

export type Msg = {
  id: string;
  from: Sender;
  text: string;
  at: string;
  session?: SessionData | null;
};

export type MessageRowProps = {
  msg: Msg;
  isMine: boolean;
  showAvatar: boolean;
};

export type AuthPayload = {
  userId?: string;
  name?: string;
};
