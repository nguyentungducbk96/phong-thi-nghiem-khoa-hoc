import React, { useState, useRef, useEffect } from 'react';
import { Send, X, Compass, Lightbulb, Info } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSelectExperimentById?: (id: string) => void;
}

interface Message {
  id: string;
  sender: 'bot' | 'user';
  text: string;
  // Gợi ý trước, giải thích sau: tin nhắn gợi ý giữ sẵn lời giải thích
  pendingExplanation?: { topicId: string; text: string; expId?: string };
  explanationShown?: boolean;
  suggestedAction?: { text: string; expId?: string };
}

// Nội dung có sẵn (không phải AI). Mỗi chủ đề có từ khóa, một câu gợi ý để em
// tự nghĩ, và lời giải thích chỉ hiện khi em hỏi lại hoặc bấm "Xem giải thích".
interface KnowledgeTopic {
  id: string;
  keywords: string[];
  hint: string;
  explanation: string;
  expId?: string;
}

const KNOWLEDGE: KnowledgeTopic[] = [
  {
    id: 'air',
    keywords: ['không khí', 'chiếm chỗ', 'cốc úp', 'úp ngược', 'bọt khí', 'phao', 'nổi', 'cốc'],
    hint: 'Em thử nghĩ xem: chiếc cốc "rỗng" có thật sự trống không? Bên trong nó có gì mà mắt mình không nhìn thấy?',
    explanation:
      'Trong cốc rỗng có đầy không khí. Không khí chiếm chỗ nên khi úp thẳng cốc xuống nước, nước không vào đầy cốc được. Khi nghiêng cốc, không khí thoát ra thành bọt khí và nước mới tràn vào.',
    expId: 'khong-khi-chiem-cho'
  },
  {
    id: 'magnet',
    keywords: ['nam châm', 'hút', 'từ tính', 'sắt', 'thép', 'nhôm', 'inox', 'đồng xu', 'kim loại'],
    hint: 'Em thử nghĩ xem: các vật bị nam châm hút thường được làm bằng chất gì? Có phải kim loại nào cũng giống nhau không?',
    explanation:
      'Nam châm hút các vật bằng sắt, thép, niken. Nam châm không hút nhôm, đồng, gỗ, nhựa, giấy. Inox có loại bị hút, có loại không, nên phải thử mới biết.',
    expId: 'nam-cham-hut-vat-nao'
  },
  {
    id: 'evaporation',
    keywords: [
      'bay hơi', 'bốc hơi', 'hơi nước', 'ngưng tụ', 'nước sôi', 'đun', 'giọt nước', 'nắp vung',
      'mây', 'mưa', 'phơi', 'khô', 'sương', 'đọng'
    ],
    hint: 'Em thử nghĩ xem: quần áo phơi ngoài nắng khô nhanh hơn hay trong bóng râm khô nhanh hơn? Nước trong áo đã đi đâu?',
    explanation:
      'Nước bay hơi ở mọi nhiệt độ, trời càng nóng thì bay hơi càng nhanh. Hơi nước gặp chỗ lạnh (như nắp vung, cốc nước đá) sẽ ngưng tụ lại thành những giọt nước nhỏ.',
    expId: 'nuoc-bay-hoi-ngung-tu'
  },
  {
    id: 'light',
    keywords: [
      'ánh sáng', 'cái bóng', 'bóng tối', 'bóng của', 'in bóng', 'bóng to', 'bóng nhỏ', 'đèn pin',
      'chiếu', 'truyền thẳng', 'vật cản', 'màn hứng', 'bóng'
    ],
    hint: 'Em thử nghĩ xem: ánh sáng đi theo đường thẳng hay đường cong? Nếu có vật chắn đường đi của ánh sáng thì phía sau vật sẽ thế nào?',
    explanation:
      'Ánh sáng truyền theo đường thẳng. Vật chắn sáng chặn ánh sáng lại nên phía sau vật có vùng tối, đó là cái bóng. Đưa vật lại gần đèn thì bóng to ra, đưa ra xa đèn thì bóng nhỏ lại.',
    expId: 'anh-sang-truyen-nhu-the-nao'
  },
  {
    id: 'circuit',
    keywords: ['mạch điện', 'mạch', 'điện', 'công tắc', 'bóng đèn', 'dây dẫn', 'pin', 'cực'],
    hint: 'Em thử nghĩ xem: dòng điện cần một "con đường" như thế nào để đi từ pin qua bóng đèn rồi quay về pin?',
    explanation:
      'Bóng đèn chỉ sáng khi có mạch kín: dòng điện đi từ một cực của pin, qua dây dẫn, công tắc đang đóng, bóng đèn rồi trở về cực kia của pin. Mở công tắc là mạch hở, đèn tắt. Nhớ: không bao giờ nghịch ổ điện trong nhà!',
    expId: 'mach-dien-don-gian'
  },
  {
    id: 'sound',
    keywords: ['âm thanh', 'tiếng', 'trống', 'đàn', 'rung', 'kêu', 'nghe', 'to nhỏ'],
    hint: 'Em thử đặt tay lên cổ rồi nói "Aaaa". Em cảm thấy gì ở cổ mình?',
    explanation:
      'Âm thanh do các vật rung động phát ra. Vật rung mạnh thì âm thanh to, rung yếu thì âm thanh nhỏ, ngừng rung thì hết tiếng.',
    expId: 'am-thanh-tao-ra-nhu-the-nao'
  },
  {
    id: 'plant',
    keywords: ['cây', 'lá', 'tưới', 'thực vật', 'hạt đậu', 'nảy mầm', 'héo', 'chậu cây'],
    hint: 'Em thử nghĩ xem: nếu quên tưới cây nhiều ngày, hoặc để cây trong tủ tối, cây sẽ thay đổi thế nào?',
    explanation:
      'Cây cần nước, ánh sáng, không khí, chất khoáng và nhiệt độ thích hợp. Thiếu nước cây héo, thiếu ánh sáng lá vàng và thân yếu.',
    expId: 'cay-can-gi-de-song'
  }
];

const PRESET_QUESTIONS = [
  {
    label: 'Tại sao phao bơi lại nổi?',
    topicId: 'air',
    hint: 'Em thử nghĩ xem: bên trong chiếc phao căng phồng có gì? Chất đó nặng hay nhẹ so với nước?',
    answer:
      'Chiếc phao chứa đầy không khí. Không khí chiếm chỗ làm phao phồng to nhưng vẫn rất nhẹ, nên phao nổi trên mặt nước và giúp em nổi theo.',
    expId: 'khong-khi-chiem-cho'
  },
  {
    label: 'Nam châm có hút được đồng xu nhôm không?',
    topicId: 'magnet',
    hint: 'Em thử nhớ lại xem: nam châm hút được những kim loại nào? Nhôm có nằm trong số đó không?',
    answer:
      'Không. Nam châm hút sắt, thép, niken nhưng không hút nhôm. Vì vậy đồng xu bằng nhôm không bị hút. Có những đồng xu làm bằng thép thì lại bị hút, nên phải biết đồng xu làm bằng gì.',
    expId: 'nam-cham-hut-vat-nao'
  },
  {
    label: 'Nước sôi bốc hơi đi đâu?',
    topicId: 'evaporation',
    hint: 'Em thử nghĩ xem: khi mở nắp nồi canh, mặt dưới nắp có gì? Những giọt đó từ đâu ra?',
    answer:
      'Nước không biến mất đâu! Nước bay hơi thành hơi nước bay vào không khí. Hơi nước gặp nắp vung lạnh hơn thì ngưng tụ thành giọt nước. Nước cũng bay hơi khi không đun, chỉ là chậm hơn.',
    expId: 'nuoc-bay-hoi-ngung-tu'
  },
  {
    label: 'Tại sao bóng của em thay đổi kích thước?',
    topicId: 'light',
    hint: 'Em thử đứng gần đèn rồi lùi ra xa đèn. Em thấy bóng của mình trên tường thay đổi thế nào?',
    answer:
      'Vì ánh sáng truyền theo đường thẳng. Khi em đứng gần đèn, em che một phần ánh sáng rộng hơn nên bóng to ra. Khi em đứng xa đèn, bóng nhỏ lại.',
    expId: 'anh-sang-truyen-nhu-the-nao'
  }
];

const INITIAL_MESSAGES: Message[] = [
  {
    id: 'm1',
    sender: 'bot',
    text: 'Chào em! Mình là Bạn Khoa Học. Em hãy hỏi mình về không khí, nước, nam châm, ánh sáng, âm thanh, mạch điện hoặc cây xanh nhé. Mình sẽ gợi ý để em tự suy nghĩ trước!'
  }
];

// Chọn chủ đề khớp nhiều nhất (từ khóa dài, cụ thể hơn được tính điểm cao hơn)
const findTopic = (text: string): KnowledgeTopic | null => {
  const lower = text.toLowerCase();
  let best: KnowledgeTopic | null = null;
  let bestScore = 0;
  KNOWLEDGE.forEach((t) => {
    const score = t.keywords.reduce((sum, k) => (lower.includes(k) ? sum + k.length : sum), 0);
    if (score > bestScore) {
      best = t;
      bestScore = score;
    }
  });
  return best;
};

export const ScienceAssistantModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onSelectExperimentById
}) => {
  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES);
  const [inputText, setInputText] = useState<string>('');
  // Chủ đề vừa được gợi ý: hỏi lại cùng chủ đề thì đưa lời giải thích
  const [lastHintTopic, setLastHintTopic] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  if (!isOpen) return null;

  const pushBot = (msg: Omit<Message, 'id' | 'sender'>) => {
    setMessages((prev) => [...prev, { id: 'b_' + Date.now() + Math.random(), sender: 'bot', ...msg }]);
  };

  const showExplanation = (messageId: string | null, topicId: string, text: string, expId?: string) => {
    if (messageId) {
      setMessages((prev) => prev.map((m) => (m.id === messageId ? { ...m, explanationShown: true } : m)));
    }
    pushBot({
      text,
      suggestedAction: expId ? { text: 'Mở thí nghiệm liên quan để tự kiểm chứng', expId } : undefined
    });
    if (lastHintTopic === topicId) setLastHintTopic(null);
  };

  const respond = (topicId: string, hint: string, explanation: string, expId?: string) => {
    if (lastHintTopic === topicId) {
      // Em đã nhận gợi ý và hỏi lại: đưa lời giải thích
      const hintMsg = [...messages].reverse().find(
        (m) => m.pendingExplanation?.topicId === topicId && !m.explanationShown
      );
      showExplanation(hintMsg?.id ?? null, topicId, explanation, expId);
      return;
    }
    pushBot({
      text: hint,
      pendingExplanation: { topicId, text: explanation, expId }
    });
    setLastHintTopic(topicId);
  };

  const handleSend = (text: string) => {
    if (!text.trim()) return;
    setMessages((prev) => [...prev, { id: 'u_' + Date.now(), sender: 'user', text }]);
    setInputText('');

    const topic = findTopic(text);
    if (!topic) {
      pushBot({
        text: 'Mình chưa có sẵn nội dung cho câu hỏi này. Em thử hỏi về không khí, nước bay hơi, nam châm, ánh sáng và cái bóng, âm thanh, mạch điện hoặc cây xanh nhé. Em cũng có thể hỏi thầy cô!'
      });
      return;
    }
    respond(topic.id, topic.hint, topic.explanation, topic.expId);
  };

  const handlePreset = (pq: (typeof PRESET_QUESTIONS)[number]) => {
    setMessages((prev) => [...prev, { id: 'u_' + Date.now(), sender: 'user', text: pq.label }]);
    respond(pq.topicId, pq.hint, pq.answer, pq.expId);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="assistant-title"
        className="bg-white rounded-3xl max-w-xl w-full h-[600px] max-h-[90vh] flex flex-col justify-between shadow-2xl border border-slate-200 overflow-hidden"
      >
        {/* Header */}
        <div className="p-4 px-6 bg-gradient-to-r from-cyan-600 to-blue-600 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center text-xl shadow-inner">
              🔬
            </div>
            <div>
              <h3 id="assistant-title" className="text-base font-bold flex items-center gap-1.5">
                Bạn Khoa Học
                <span className="text-[10px] font-semibold bg-white/20 px-2 py-0.5 rounded-full">
                  Trợ lý học tập
                </span>
              </h3>
              <p className="text-[11px] text-cyan-100">Gợi ý để em tự suy nghĩ trước</p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Đóng Bạn Khoa Học"
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Honest notice */}
        <div className="px-4 py-2 bg-amber-50 border-b border-amber-200 text-[11px] text-amber-900 flex items-center gap-1.5">
          <Info className="w-3.5 h-3.5 shrink-0" />
          Bạn Khoa Học trả lời theo nội dung có sẵn, chưa dùng AI.
        </div>

        {/* Chat History */}
        <div ref={listRef} className="flex-1 p-5 overflow-y-auto space-y-3.5 bg-slate-50/50" aria-live="polite">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'}`}
            >
              <div
                className={`max-w-[85%] p-3.5 rounded-2xl text-xs leading-relaxed ${
                  m.sender === 'user'
                    ? 'bg-cyan-600 text-white rounded-br-xs'
                    : 'bg-white border border-slate-200 text-slate-800 rounded-bl-xs shadow-2xs'
                }`}
              >
                {m.pendingExplanation && (
                  <span className="font-bold text-amber-700 flex items-center gap-1 mb-1">
                    <Lightbulb className="w-3.5 h-3.5" /> Gợi ý
                  </span>
                )}
                {m.text}
              </div>

              {m.pendingExplanation && !m.explanationShown && (
                <button
                  onClick={() =>
                    showExplanation(
                      m.id,
                      m.pendingExplanation!.topicId,
                      m.pendingExplanation!.text,
                      m.pendingExplanation!.expId
                    )
                  }
                  className="mt-1.5 text-[11px] font-bold text-amber-800 bg-amber-50 border border-amber-200 px-3 py-1 rounded-full hover:bg-amber-100 transition-colors"
                >
                  Em nghĩ rồi, xem giải thích
                </button>
              )}

              {/* Action chip */}
              {m.suggestedAction && m.suggestedAction.expId && onSelectExperimentById && (
                <button
                  onClick={() => {
                    onSelectExperimentById(m.suggestedAction!.expId!);
                    onClose();
                  }}
                  className="mt-1.5 flex items-center gap-1.5 text-[11px] font-bold text-cyan-700 bg-cyan-50 border border-cyan-200 px-3 py-1 rounded-full hover:bg-cyan-100 transition-colors"
                >
                  <Compass className="w-3.5 h-3.5" />
                  {m.suggestedAction.text} →
                </button>
              )}
            </div>
          ))}
        </div>

        {/* Quick Suggestion Chips */}
        <div className="px-4 py-2 border-t border-slate-100 bg-white flex items-center gap-1.5 overflow-x-auto">
          <span className="text-[10px] text-slate-400 font-semibold shrink-0">Hỏi nhanh:</span>
          {PRESET_QUESTIONS.map((pq) => (
            <button
              key={pq.label}
              onClick={() => handlePreset(pq)}
              className="text-[11px] whitespace-nowrap bg-slate-100 hover:bg-cyan-50 hover:text-cyan-700 text-slate-600 px-2.5 py-1 rounded-full transition-colors border border-slate-200/60"
            >
              {pq.label}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <div className="p-3 bg-white border-t border-slate-200 flex items-center gap-2">
          <input
            type="text"
            value={inputText}
            aria-label="Câu hỏi cho Bạn Khoa Học"
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSend(inputText);
            }}
            placeholder="Hỏi về không khí, nước, nam châm, ánh sáng, âm thanh, điện, cây..."
            className="flex-1 px-4 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-cyan-500 focus:bg-white"
          />
          <button
            onClick={() => handleSend(inputText)}
            aria-label="Gửi câu hỏi"
            className="p-2.5 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl transition-colors shadow-2xs"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
