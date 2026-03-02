import { useState, useEffect } from "react";
import { ShieldCheck, Bot } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  type ApiKeys,
  type ProviderKey,
  VALID_PROVIDERS,
  PROVIDER_LABELS,
} from "@/lib/types";

interface SettingsScreenProps {
  keys: ApiKeys;
  chatProvider: ProviderKey;
  onKeyChange: (provider: ProviderKey, value: string) => void;
  onChatProviderChange: (provider: ProviderKey) => void;
  maxOutputTokens: number;
  onMaxOutputTokensChange: (value: number) => void;
}

export function SettingsScreen({
  keys,
  chatProvider,
  onKeyChange,
  onChatProviderChange,
  maxOutputTokens,
  onMaxOutputTokensChange,
}: SettingsScreenProps) {
  const [tokenInput, setTokenInput] = useState(String(maxOutputTokens));
  useEffect(() => {
    setTokenInput(String(maxOutputTokens));
  }, [maxOutputTokens]);

  const handleTokenBlur = () => {
    const v = parseInt(tokenInput, 10);
    if (!Number.isNaN(v) && v >= 256 && v <= 32768) {
      onMaxOutputTokensChange(v);
    } else {
      setTokenInput(String(maxOutputTokens));
    }
  };

  return (
    <div className="p-6 space-y-8">
      <div className="space-y-1 mb-6">
        <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">config</span>
        <h2 className="text-sm font-semibold text-foreground">설정</h2>
      </div>
      <div className="space-y-3">
        <h3 className="text-xs font-semibold flex items-center gap-2 text-foreground font-mono uppercase tracking-wider">
          <Bot size={14} className="text-primary shrink-0" />
          채팅에 사용할 Provider
        </h3>
        <Select
          value={chatProvider}
          onValueChange={(v) => onChatProviderChange(v as ProviderKey)}
        >
          <SelectTrigger className="w-full h-9 font-mono text-sm">
            <SelectValue placeholder="Provider 선택" />
          </SelectTrigger>
          <SelectContent>
            {VALID_PROVIDERS.map((p) => (
              <SelectItem key={p} value={p}>
                {PROVIDER_LABELS[p]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          채팅 시 API 질의에 사용할 LLM provider를 선택합니다.
        </p>
      </div>

      <div className="space-y-3">
        <h3 className="text-xs font-semibold flex items-center gap-2 text-foreground font-mono uppercase tracking-wider">
          Max Output Tokens
        </h3>
        <Input
          type="number"
          min={256}
          max={32768}
          step={256}
          placeholder="4096"
          value={tokenInput}
          onChange={(e) => setTokenInput(e.target.value)}
          onBlur={handleTokenBlur}
          className="h-9 font-mono text-sm w-full max-w-[180px]"
        />
        <p className="text-xs text-muted-foreground">
          LLM 응답 최대 토큰 수입니다. (256 ~ 32768, 기본 4096)
        </p>
      </div>

      <div className="space-y-3">
        <h3 className="text-xs font-semibold flex items-center gap-2 text-foreground font-mono uppercase tracking-wider">
          <ShieldCheck size={14} className="text-success shrink-0" />
          API 키 설정
        </h3>
        <Tabs defaultValue="gemini" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            {VALID_PROVIDERS.map((p) => (
              <TabsTrigger key={p} value={p} className="text-xs font-mono">
                {PROVIDER_LABELS[p]}
              </TabsTrigger>
            ))}
          </TabsList>
          {VALID_PROVIDERS.map((p) => (
            <TabsContent key={p} value={p} className="mt-4">
              <div className="space-y-2">
                <Label
                  htmlFor={`api-key-${p}`}
                  className="text-[10px] font-mono font-medium uppercase tracking-wider text-muted-foreground"
                >
                  {PROVIDER_LABELS[p]} API Key
                </Label>
                <Input
                  id={`api-key-${p}`}
                  type="password"
                  placeholder={`${PROVIDER_LABELS[p]} API 키를 입력하세요`}
                  value={keys[p]}
                  onChange={(e) => onKeyChange(p, e.target.value)}
                  className="h-9 font-mono text-sm"
                />
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </div>
  );
}
