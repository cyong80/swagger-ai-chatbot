import { useRef } from "react";
import { Settings, MessageSquare } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ModeToggle } from "@/components/mode-toggle";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ChatScreen } from "@/screens/ChatScreen";
import { SettingsScreen } from "@/screens/SettingsScreen";
import { useSettings } from "@/hooks/useSettings";
import { useSpec } from "@/hooks/useSpec";
import { useChat } from "@/hooks/useChat";
import { useApiPicker } from "@/hooks/useApiPicker";

export default function App() {
  const settings = useSettings();
  const { provider, keys, maxOutputTokens } = settings;

  const beforeReloadRef = useRef<() => void>(() => {});
  const {
    spec,
    reloadSpec,
    showReloadConfirm,
    onConfirmReload,
    onDismissReloadConfirm,
  } = useSpec(undefined, {
    onBeforeReload: () => beforeReloadRef.current(),
  });

  const chat = useChat(provider, keys, spec, maxOutputTokens);
  beforeReloadRef.current = chat.clearMessages;

  const { handlePickApi } = useApiPicker(spec, chat.handleSendWithPrompt);

  return (
    <div className="h-screen flex flex-col bg-background text-foreground antialiased border-l border-border dev-bg-pattern">
      <AlertDialog
        open={showReloadConfirm}
        onOpenChange={(open) => !open && onDismissReloadConfirm()}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>API 스펙 다시 불러오기</AlertDialogTitle>
            <AlertDialogDescription>
              브라우저 탭이 변경되었습니다. 현재 탭의 API 스펙을 다시
              불러올까요?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={onDismissReloadConfirm}>
              아니오
            </AlertDialogCancel>
            <AlertDialogAction onClick={onConfirmReload}>
              재로드
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <Tabs
        defaultValue="chat"
        className="flex-1 flex flex-col overflow-hidden min-h-0"
      >
        <header className="px-4 py-3 border-b border-border bg-card/80 backdrop-blur-sm shrink-0 ring-1 ring-border/50">
          <div className="flex items-center justify-between gap-2 mb-2">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono text-primary tracking-wider uppercase">
                Swagger AI
              </span>
              <span className="text-muted-foreground/60 font-mono text-[10px]">
                /
              </span>
              <span className="text-[10px] font-mono text-muted-foreground">
                Assistant
              </span>
            </div>
            <ModeToggle />
          </div>
          <TabsList className="grid w-full grid-cols-2 h-9 font-medium">
            <TabsTrigger value="chat" className="gap-2">
              <MessageSquare size={16} className="shrink-0" aria-hidden />
              Chat
            </TabsTrigger>
            <TabsTrigger value="settings" className="gap-2">
              <Settings size={16} className="shrink-0" aria-hidden />
              Settings
            </TabsTrigger>
          </TabsList>
        </header>

        <TabsContent
          value="chat"
          className="flex-1 flex flex-col overflow-hidden m-0 p-0 border-none min-h-0"
        >
          <ChatScreen
            messages={chat.messages}
            input={chat.input}
            onInputChange={chat.setInput}
            onSend={chat.handleSend}
            isLoading={chat.isLoading}
            spec={spec}
            onRefreshSpec={reloadSpec}
            onPickApi={handlePickApi}
          />
        </TabsContent>

        <TabsContent value="settings" className="m-0 overflow-auto">
          <SettingsScreen
            keys={keys}
            chatProvider={provider}
            onKeyChange={settings.handleKeyChange}
            onChatProviderChange={settings.handleProviderChange}
            maxOutputTokens={maxOutputTokens}
            onMaxOutputTokensChange={settings.handleMaxOutputTokensChange}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
