import { Outlet, useNavigate, useParams } from "react-router-dom";
import {
  Card,
  CardHeader,
  CardBody,
  CardFooter,
  Divider,
  Listbox,
  ListboxItem,
  User,
} from "@heroui/react";

import { images } from "@/variables/data";

function ChatsList() {
  const navigate = useNavigate();
  const { chatId } = useParams();
  const selected = chatId ? new Set([chatId]) : new Set<string>();

  return (
    <Card className="max-h-40 w-full shrink-0 bg-zinc-800/70 p-2 text-white md:max-h-none md:h-full md:w-60 md:p-3 xl:w-64">
      <CardHeader className="flex flex-col items-start p-1">
        <span className="my-1 text-left text-base font-semibold md:my-2 md:text-lg">
          Chats
        </span>
      </CardHeader>

      <Divider />

      <CardBody className="min-h-0 overflow-y-auto p-0 dark:border-default-100">
        <Listbox
          aria-label="Actions"
          className="w-full"
          selectedKeys={selected}
          onAction={(key) => navigate(`/chats/${key}`)}
        >
          <ListboxItem key="1" textValue="Diabal Agent">
            <User
              avatarProps={{ src: images.diabal }}
              className="font-semibold"
              description="Agent"
              name="Diabal"
            />
          </ListboxItem>
        </Listbox>
      </CardBody>

      <Divider />

      <CardFooter className="hidden text-center text-xs font-semibold md:flex">
        Made by Eng. Tony
      </CardFooter>
    </Card>
  );
}

function chatsContainer() {
  return (
    <div className="h-dvh overflow-hidden bg-zinc-950 px-2 py-2 md:px-4 md:py-3">
      <div className="mx-auto flex h-full min-h-0 w-full max-w-[1180px] flex-col gap-2 md:flex-row md:gap-3">
        <ChatsList />

        <Divider className="hidden md:block" orientation="vertical" />

        <main className="flex min-h-0 min-w-0 flex-1">
          <div className="flex min-h-0 min-w-0 flex-1">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}

export default chatsContainer;
