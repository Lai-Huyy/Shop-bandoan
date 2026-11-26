'use client';

import { useEffect, useRef, useState } from 'react';
import { MessageCircle, Send } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import data from './chatbot-data.json';
import { replyTo } from './reply';
import { WalletReply } from './wallet-reply';
import { useAuth } from '@/hooks/use-auth';

type Turn = { id: number; question: string } & ReturnType<typeof replyTo>;

export function StoreChat() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [history, setHistory] = useState<Turn[]>([]);
  const nextId = useRef(0);
  const log = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (log.current) log.current.scrollTop = log.current.scrollHeight;
  }, [history, open]);

  function send(value: string) {
    const question = value.trim();
    if (!question) return;
    const turn = { id: ++nextId.current, question, ...replyTo(question) };
    setHistory((previous) => [...previous.slice(-19), turn]);
    setInput('');
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="fixed bottom-6 right-20 z-40 rounded-full bg-orange-600 text-white shadow-lg">
          <MessageCircle size={18} /> Chat với NICEGA
        </Button>
      </DialogTrigger>
      <DialogContent className="flex max-h-[85dvh] max-w-md flex-col gap-4 overflow-y-auto rounded-2xl">
        <DialogTitle className="pr-8 text-xl font-bold">
          Hỗ trợ mua hàng
        </DialogTitle>
        <DialogDescription>{data.welcome}</DialogDescription>
        <div
          ref={log}
          role="log"
          aria-label="Hội thoại"
          className="min-h-12 space-y-4 overflow-y-auto"
        >
          {history.map((turn) => (
            <div key={turn.id} className="space-y-2">
              <p className="ml-auto w-fit max-w-full break-words rounded-xl bg-secondary px-3 py-2">
                {turn.question}
              </p>
              {turn.action === 'wallet' ? (
                <WalletTurn intro={turn.answer} />
              ) : (
                <p className="whitespace-pre-line">{turn.answer}</p>
              )}
            </div>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          {data.topics.map((topic) => (
            <Button
              key={topic.label}
              variant="outline"
              size="sm"
              onClick={() => send(topic.label)}
            >
              {topic.label}
            </Button>
          ))}
        </div>
        <form
          className="flex gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            send(input);
          }}
        >
          <Input
            aria-label="Câu hỏi của bạn"
            placeholder="Nhập câu hỏi…"
            maxLength={300}
            value={input}
            onChange={(event) => setInput(event.target.value)}
          />
          <Button
            type="submit"
            size="icon"
            aria-label="Gửi câu hỏi"
            disabled={!input.trim()}
          >
            <Send size={18} />
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function WalletTurn({ intro }: { intro: string }) {
  const { user, isReady } = useAuth();
  if (!isReady) return <p>Đang kiểm tra tài khoản…</p>;
  if (!user)
    return <p>Bạn hãy đăng nhập để xem voucher trong ví của mình nhé.</p>;
  return <WalletReply key={user.id} userId={user.id} intro={intro} />;
}
