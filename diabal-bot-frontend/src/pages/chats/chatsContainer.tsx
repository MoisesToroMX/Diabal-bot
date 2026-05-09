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
    <Card className="m-2 shrink-0 bg-zinc-800/70 p-3 text-white md:m-0 md:h-full md:w-60 xl:w-64">
      <CardHeader className="flex flex-col items-start p-1 md:flex">
        <span className="text-lg text-left font-semibold my-2">Chats</span>
      </CardHeader>

      <Divider />

      <CardBody className="p-0 dark:border-default-100">
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
    <div className="min-h-dvh overflow-x-hidden bg-black p-2 md:h-dvh md:p-3">
      <div className="mx-auto flex h-full w-full max-w-[1720px] flex-col gap-2 md:flex-row md:gap-3">
        <ChatsList />

        <Divider className="hidden md:block" orientation="vertical" />

        <main className="flex min-h-0 min-w-0 flex-1">
          <div className="min-h-0 min-w-0 flex-1">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}

export default chatsContainer;
