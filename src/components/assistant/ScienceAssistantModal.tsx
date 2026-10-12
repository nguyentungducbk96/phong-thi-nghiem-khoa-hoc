import React, { useState } from 'react';
import { Bot, Send, Sparkles, HelpCircle, X, Compass, Lightbulb } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSelectExperimentById?: (id: string) => void;
}

interface Message {
  id: string;
  sender: 'bot' | 'user';
  text: string;
  suggestedAction?: { text: string; expId?: string };
}

const INITIAL_MESSAGES: Message[] = [
  {
    id: 'm1',
    sender: 'bot',
    text: 'Chào bạn nhỏ! Mình là Bạn Khoa Học 🤖. Hôm nay bạn đang tò mò về điều gì trong thế giới tự nhiên xung quanh ta?'
  }
];

const PRESET_QUESTIONS = [
  {
    label: 'Tại sao phao bơi lại nổi?',
    answer:
      'Câu hỏi rất hay! Chiếc phao bơi chứa đầy không khí bên trong. Vì không khí nhẹ hơn nước và chiếm chỗ tạo ra thể tích lớn, nước sẽ nâng phao và bạn nổi lên! Bạn có muốn làm thí nghiệm "Không khí có chiếm chỗ không?" để thử tận mắt không?',
    expId: 'khong-khi-chiem-cho'
  },
  {
    label: 'Nam châm có hút được đồng xu nhôm không?',
    answer:
      'Gợi ý cho bạn nhé: Bạn hãy thử nhớ lại xem nam châm chỉ hút được các kim loại nào? Đúng rồi, chỉ các vật liệu chứa sắt, thép hoặc niken mới bị hút. Nhôm không có từ tính nên nam châm không hút được! Hãy vào bàn thí nghiệm để thử nhé!',
    expId: 'nam-cham-hut-vat-nao'
  },
  {
    label: 'Nước sôi bốc hơi đi đâu?',
    answer:
      'Nước không hề biến mất đâu nhé! Khi gặp nhiệt độ cao, nước lỏng biến thành các hạt hơi nước bay vào không khí. Khi gặp lạnh (như nắp vung hay mây trên cao), chúng lại tụ lại thành giọt nước đấy!',
    expId: 'nuoc-bay-hoi-ngung-tu'
  },
  {
    label: 'Tại sao bóng của em thay đổi kích thước?',
    answer:
      'Do ánh sáng truyền theo đường thẳng! Khi em đến càng gần nguồn sáng (đèn pin hoặc ngọn nến), cơ thể em che chắn một chùm sáng rộng hơn, khiến bóng in trên tường phóng to lên đấy!',
    expId: 'anh-sang-truyen-nhu-the-nao'
  }
];

export const ScienceAssistantModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onSelectExperimentById
}) => {
  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES);
  const [inputText, setInputText] = useState<string>('');

  if (!isOpen) return null;

  const handleSend = (text: string, presetExpId?: string) => {
    if (!text.trim()) return;

    const userMsg: Message = {
      id: 'u_' + Date.now(),
      sender: 'user',
      text
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');

    // Generate pedagogical Socratic answer
    setTimeout(() => {
      let botReply =
        'Thầy cô và các nhà khoa học luôn khuyến khích đặt câu hỏi! Bạn hãy thử suy nghĩ xem: hiện tượng này xảy ra là do nhiệt độ, ánh sáng, từ tính hay sự chuyển động cơ học?';
      let linkExpId: string | undefined = undefined;

      const lower = text.toLowerCase();
      if (lower.includes('không khí') || lower.includes('cốc') || lower.includes('nước tràn')) {
        botReply =
          'Gợi ý nhé: Trong chiếc cốc úp ngược không hề trống rỗng đâu, mà chứa đầy một chất khí vô hình. Chính chất khí đó đã ngăn không cho nước tràn vào đấy!';
        linkExpId = 'khong-khi-chiem-cho';
      } else if (lower.includes('nam châm') || lower.includes('hút') || lower.includes('kim loại')) {
        botReply =
          'Nam châm có lực từ rất kỳ diệu! Nhưng nó rất "kén chọn" - chỉ hút sắt, thép, niken thôi. Các vật bằng gỗ, nhựa, nhôm thì nam châm chịu thua!';
        linkExpId = 'nam-cham-hut-vat-nao';
      } else if (lower.includes('đèn') || lower.includes('điện') || lower.includes('pin')) {
        botReply =
          'Để bóng đèn sáng, các electron phải chạy liên tục trong một vòng tròn khép kín từ cực dương về cực âm. Nếu công tắc mở, đường đi bị ngắt quãng nên đèn tắt ngay!';
        linkExpId = 'mach-dien-don-gian';
      } else if (lower.includes('trống') || lower.includes('âm thanh') || lower.includes('tiếng')) {
        botReply =
          'Âm thanh bắt nguồn từ sự RUNG ĐỘNG! Khi bạn nói, dây thanh quản ở cổ họng rung lên. Khi bạn gõ trống, mặt trống rung đẩy các hạt gạo nhảy múa!';
        linkExpId = 'am-thanh-tao-ra-nhu-the-nao';
      } else if (lower.includes('cây') || lower.includes('lá') || lower.includes('tưới')) {
        botReply =
          'Cây xanh là nhà máy quang hợp tuyệt vời! Cây cần đủ 4 yếu tố: Nước, Ánh sáng mặt trời, Không khí và Chất khoáng trong đất để lớn nhanh.';
        linkExpId = 'cay-can-gi-de-song';
      }

      if (presetExpId) linkExpId = presetExpId;

      const botMsg: Message = {
        id: 'b_' + Date.now(),
        sender: 'bot',
        text: botReply,
        suggestedAction: linkExpId
          ? { text: 'Mở thí nghiệm liên quan', expId: linkExpId }
          : undefined
      };

      setMessages((prev) => [...prev, botMsg]);
    }, 450);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-xl w-full h-[580px] flex flex-col justify-between shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="p-4 px-6 bg-gradient-to-r from-cyan-600 to-blue-600 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center text-xl shadow-inner">
              🤖
            </div>
            <div>
              <h3 className="text-base font-bold flex items-center gap-1.5">
                Bạn Khoa Học
                <span className="text-[10px] font-semibold bg-white/20 px-2 py-0.5 rounded-full">
                  Trợ lý học tập
                </span>
              </h3>
              <p className="text-[11px] text-cyan-100">
                Gợi mở tư duy khoa học theo chuẩn Khoa học lớp 4
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Chat History */}
        <div className="flex-1 p-5 overflow-y-auto space-y-3.5 bg-slate-50/50">
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
                {m.text}
              </div>

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
          {PRESET_QUESTIONS.map((pq, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(pq.label, pq.expId)}
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
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSend(inputText);
            }}
            placeholder="Hỏi Bạn Khoa Học bất kỳ câu hỏi nào..."
            className="flex-1 px-4 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-cyan-500 focus:bg-white"
          />
          <button
            onClick={() => handleSend(inputText)}
            className="p-2.5 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl transition-colors shadow-2xs"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
