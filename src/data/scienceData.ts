import { ScienceTopic, Experiment, Quiz, ScienceVideo, TopicId } from '../types';

export const SCIENCE_TOPICS: ScienceTopic[] = [
  {
    id: 'chat',
    name: 'Chất',
    iconName: 'Sparkles',
    color: 'from-amber-500 to-orange-500',
    description: 'Tính chất và sự chuyển thể của các chất xung quanh chúng ta',
  },
  {
    id: 'nang-luong',
    name: 'Năng lượng',
    iconName: 'Zap',
    color: 'from-yellow-400 to-amber-600',
    description: 'Năng lượng điện, nguồn năng lượng và cách sử dụng an toàn, tiết kiệm',
  },
  {
    id: 'khong-khi-nuoc',
    name: 'Không khí và nước',
    iconName: 'Droplets',
    color: 'from-cyan-500 to-blue-600',
    description: 'Tính chất, sự chiếm chỗ của không khí và vòng tuần hoàn của nước',
  },
  {
    id: 'anh-sang-am-thanh',
    name: 'Ánh sáng và âm thanh',
    iconName: 'Sun',
    color: 'from-sky-400 to-indigo-600',
    description: 'Sự truyền thẳng của ánh sáng, bóng tối và sự lan truyền dao động âm thanh',
  },
  {
    id: 'nhiet',
    name: 'Nhiệt',
    iconName: 'Flame',
    color: 'from-orange-500 to-red-600',
    description: 'Sự dẫn nhiệt, nhiệt độ và các hiện tượng bay hơi, ngưng tụ',
  },
  {
    id: 'thuc-vat-dong-vat',
    name: 'Thực vật và động vật',
    iconName: 'Leaf',
    color: 'from-emerald-500 to-teal-600',
    description: 'Các điều kiện cần thiết để thực vật và động vật sinh trưởng và phát triển',
  },
  {
    id: 'con-nguoi-suc-khoe',
    name: 'Con người và sức khỏe',
    iconName: 'HeartPulse',
    color: 'from-rose-500 to-pink-600',
    description: 'Dinh dưỡng hợp lý, bảo vệ cơ thể và phòng tránh bệnh học đường',
  },
  {
    id: 'sinh-vat-moi-truong',
    name: 'Sinh vật và môi trường',
    iconName: 'Globe2',
    color: 'from-teal-500 to-emerald-700',
    description: 'Mối quan hệ qua lại giữa sinh vật và môi trường sống quanh ta',
  }
];

export const EXPERIMENTS_DATA: Experiment[] = [
  {
    id: 'khong-khi-chiem-cho',
    title: 'Không khí có chiếm chỗ không?',
    englishTitle: 'Does Air Take Up Space?',
    topicId: 'khong-khi-nuoc',
    grade: 4,
    durationMinutes: 15,
    difficulty: 'Dễ',
    thumbnailUrl: './images/exp_air_pressure_1791767471782.jpg',
    description: 'Quan sát hiện tượng chiếc cốc thủy tinh úp ngược khi nhúng vào chậu nước và giải thích tại sao nước không vào được trong cốc.',
    objective: 'Chứng minh được không khí có ở xung quanh ta và không khí chiếm chỗ trong không gian.',
    inquiryQuestion: 'Khi ta úp ngược chiếc cốc rỗng rồi nhúng thẳng đứng xuống nước, nước có tràn vào đầy cốc ngay lập tức không? Vì sao?',
    backgroundKnowledge: 'Xung quanh chúng ta và trong mọi vật rỗng đều có không khí. Không khí là chất khí, không màu, không mùi, không vị và chiếm chỗ trong không gian.',
    equipment: [
      'Chậu nước trong suốt chứa nước sạch',
      'Cốc thủy tinh trong suốt hình trụ',
      'Mẩu giấy khô gắn ở đáy bên trong cốc',
      'Thước đo mực nước'
    ],
    procedureSteps: [
      'Gắn một mẩu giấy khô vào đáy trong của cốc thủy tinh.',
      'Cầm cốc úp ngược miệng cốc xuống và nhúng thẳng đứng vào chậu nước.',
      'Quan sát xem nước có tràn vào trong cốc làm ướt giấy hay không.',
      'Nghiêng nhẹ miệng cốc sang một bên và quan sát hiện tượng bọt khí nổi lên và nước tràn vào cốc.'
    ],
    safetyWarning: 'Mô phỏng an toàn. Khi làm thực tế trên lớp, cần thao tác cẩn thận tránh làm vỡ cốc thủy tinh và làm đổ nước ra bàn.',
    predictionOptions: [
      {
        id: 'pred_1',
        text: 'Nước sẽ tràn vào đầy cốc ngay lập tức vì cốc hoàn toàn rỗng.',
        isCorrect: false,
        explanation: 'Cốc nhìn như rỗng nhưng thực chất bên trong đã chứa đầy không khí!'
      },
      {
        id: 'pred_2',
        text: 'Nước không vào được trong cốc vì không khí bên trong cốc đã chiếm chỗ.',
        isCorrect: true,
        explanation: 'Chính xác! Không khí bên trong cản không cho nước tràn vào.'
      },
      {
        id: 'pred_3',
        text: 'Nước chỉ vào được một nửa cốc rồi ngừng lại do sức căng bề mặt.',
        isCorrect: false,
        explanation: 'Không khí bên trong giữ toàn bộ không gian của cốc khi nhúng thẳng đứng.'
      }
    ],
    postQuestions: [
      {
        id: 'q1',
        question: 'Tại sao khi nhúng cốc thẳng đứng, mẩu giấy ở đáy cốc vẫn khô ráo?',
        options: [
          'Vì giấy có lớp chống thấm nước đặc biệt.',
          'Vì không khí bên trong cốc chiếm chỗ, ngăn không cho nước dâng lên chạm vào giấy.',
          'Vì nước trong chậu không đủ sức ép lên cốc.',
          'Vì cốc có nắp vô hình đậy lại.'
        ],
        correctIndex: 1,
        explanation: 'Không khí chiếm chỗ trong toàn bộ không gian của cốc, đẩy mặt nước xuống và ngăn nước tiếp xúc với giấy.'
      },
      {
        id: 'q2',
        question: 'Khi ta nghiêng cốc, hiện tượng gì đã xảy ra?',
        options: [
          'Bọt khí sủi tăm thoát ra ngoài và nước bắt đầu tràn vào thế chỗ của không khí.',
          'Cốc bị hút chặt xuống đáy chậu nước.',
          'Nước trong chậu biến mất hoàn toàn.',
          'Không có hiện tượng gì thay đổi so với khi nhúng thẳng.'
        ],
        correctIndex: 0,
        explanation: 'Khi nghiêng cốc, không khí thoát ra ngoài dưới dạng các bọt khí nổi lên, nhường chỗ trống cho nước tràn vào trong cốc.'
      }
    ],
    scientificConclusion: 'Không khí có ở xung quanh chúng ta và trong các khoảng trống của mọi vật. Không khí chiếm chỗ trong không gian.',
    realWorldApplication: {
      title: 'Ứng dụng: Chuông lặn và Phao cứu sinh',
      scenario: 'Các thợ lặn thời xưa sử dụng "chuông lặn" - một chiếc chuông kim loại lớn úp ngược xuống biển giúp thợ lặn thở được dưới đáy biển sâu.',
      question: 'Dựa vào tính chất không khí chiếm chỗ, em hãy giải thích tại sao chiếc phao bơi khi được bơm căng khí lại có thể nâng người nổi trên mặt nước?',
      answer: 'Không khí được bơm vào chiếm chỗ bên trong phao làm phao phồng to nhưng vẫn rất nhẹ, nên phao nổi trên mặt nước và giúp người nổi theo.'
    }
  },
  {
    id: 'nam-cham-hut-vat-nao',
    title: 'Nam châm hút những vật nào?',
    englishTitle: 'Which Materials Do Magnets Attract?',
    topicId: 'nang-luong',
    grade: 4,
    durationMinutes: 15,
    difficulty: 'Dễ',
    thumbnailUrl: './images/exp_magnet_materials_1791767483863.jpg',
    description: 'Thử nghiệm kéo nam châm chữ U lại gần các vật mẫu khác nhau trên bàn thí nghiệm để kiểm tra từ tính của từng vật liệu.',
    objective: 'Nhận biết được nam châm có từ tính, hút được các vật bằng sắt, thép, niken nhưng không hút được đồng, nhôm, gỗ, nhựa, giấy.',
    inquiryQuestion: 'Liệu nam châm có hút được tất cả các đồ vật bằng kim loại và phi kim không?',
    backgroundKnowledge: 'Nam châm có hai cực: cực Bắc (N) và cực Nam (S). Nam châm có khả năng hút các vật làm từ vật liệu sắt từ như sắt, thép, niken, coban.',
    equipment: [
      'Nam châm chữ U với 2 cực Bắc (N - màu đỏ) và Nam (S - màu xanh)',
      'Đinh sắt',
      'Kẹp giấy bằng thép',
      'Đồng xu bằng nhôm',
      'Đồng xu bằng thép mạ niken',
      'Miếng gỗ nhỏ',
      'Thước kẻ nhựa',
      'Tờ giấy tập',
      'Thìa inox (loại inox bị nam châm hút)'
    ],
    procedureSteps: [
      'Đặt các vật mẫu trên bàn thí nghiệm.',
      'Đưa từ từ thanh nam châm lại gần từng vật thể.',
      'Quan sát xem vật nào bị nam châm hút dính vào cực nam châm, vật nào đứng yên.',
      'Ghi chép kết quả vào bảng phân loại và kiểm tra từ tính.'
    ],
    safetyWarning: 'Tránh để nam châm lại gần đồng hồ cơ, thẻ từ hoặc các thiết bị điện tử nhạy cảm.',
    predictionOptions: [
      {
        id: 'pred_1',
        text: 'Nam châm sẽ hút tất cả các loại kim loại và cả gỗ nhẹ.',
        isCorrect: false,
        explanation: 'Nam châm không hút được mọi kim loại (ví dụ: không hút nhôm, đồng nguyên chất).'
      },
      {
        id: 'pred_2',
        text: 'Nam châm chỉ hút các vật làm bằng sắt, thép hoặc hợp kim có từ tính.',
        isCorrect: true,
        explanation: 'Chính xác! Nam châm chỉ tác dụng lực từ lên vật liệu sắt từ.'
      },
      {
        id: 'pred_3',
        text: 'Nam châm chỉ hút các vật có màu sáng bóng.',
        isCorrect: false,
        explanation: 'Khả năng hút phụ thuộc vào bản chất vật liệu, không phụ thuộc vào màu sắc hay độ sáng.'
      }
    ],
    postQuestions: [
      {
        id: 'q1',
        question: 'Trong các vật mẫu, những vật nào bị nam châm hút?',
        options: [
          'Đinh sắt, kẹp giấy thép, đồng xu thép mạ niken, thìa inox mẫu.',
          'Miếng gỗ, thước kẻ nhựa, tờ giấy.',
          'Đồng xu nhôm, miếng gỗ, thước nhựa.',
          'Tất cả các vật đều bị hút như nhau.'
        ],
        correctIndex: 0,
        explanation: 'Đinh sắt, kẹp giấy thép, đồng xu thép mạ niken và chiếc thìa inox mẫu đều bị nam châm hút. Lưu ý: có nhiều loại inox không bị nam châm hút, chiếc thìa trong mô phỏng là loại inox bị hút.'
      },
      {
        id: 'q2',
        question: 'Tại sao chiếc đồng xu nhôm và thước kẻ nhựa lại không bị nam châm hút?',
        options: [
          'Vì chúng quá nặng đối với nam châm.',
          'Vì nhôm và nhựa không phải là vật liệu sắt từ nên không chịu tác dụng của lực từ.',
          'Vì nam châm đã hết năng lượng từ.',
          'Vì bề mặt của chúng quá trơn nhẵn.'
        ],
        correctIndex: 1,
        explanation: 'Chỉ các vật liệu có tính sắt từ (chứa sắt, thép, niken, coban) mới bị nam châm hút.'
      }
    ],
    scientificConclusion: 'Nam châm hút các vật làm bằng sắt, thép, niken và một số hợp kim khác; không hút các vật bằng gỗ, nhựa, thủy tinh, giấy, nhôm, đồng. Không phải kim loại nào cũng bị nam châm hút, kể cả inox: có loại bị hút, có loại không.',
    realWorldApplication: {
      title: 'Ứng dụng: Cần cẩu điện từ tại bãi phế liệu',
      scenario: 'Tại các bãi tập kết phế liệu, công nhân dùng cần cẩu có gắn nam châm điện cực lớn để phân loại kim loại.',
      question: 'Cần cẩu nam châm này giúp ích gì cho việc phân loại rác thải tái chế?',
      answer: 'Cần cẩu nam châm hút nhanh các mảnh sắt thép phế liệu lẫn trong đống rác mà không hút đất đá, gỗ, nhựa, giúp việc phân loại tự động và an toàn.'
    }
  },
  {
    id: 'nuoc-bay-hoi-ngung-tu',
    title: 'Nước bay hơi và ngưng tụ',
    englishTitle: 'Water Evaporation and Condensation',
    topicId: 'khong-khi-nuoc',
    grade: 4,
    durationMinutes: 20,
    difficulty: 'Trung bình',
    thumbnailUrl: './images/exp_water_cycle_1791767495614.jpg',
    description: 'Điều chỉnh nguồn nhiệt để nước bay hơi nhanh hay chậm, điều chỉnh mức làm lạnh của đĩa để quan sát các giọt nước ngưng tụ.',
    objective: 'Hiểu được nước chuyển từ thể lỏng sang thể khí (bay hơi) ở mọi nhiệt độ, nóng hơn thì bay hơi nhanh hơn; hơi nước gặp lạnh chuyển thành thể lỏng (ngưng tụ).',
    inquiryQuestion: 'Khi nước trong cốc cạn dần ngoài trời nắng, nước đã biến đi đâu? Làm thế nào để thu lại được những giọt nước từ hơi nước?',
    backgroundKnowledge: 'Nước tồn tại ở ba thể: thể lỏng, thể khí (hơi nước) và thể rắn (băng/đá). Quá trình nước chuyển từ thể lỏng sang thể khí gọi là bay hơi; ngược lại, từ thể khí sang thể lỏng gọi là ngưng tụ.',
    equipment: [
      'Bình đun thủy tinh chịu nhiệt chứa nước',
      'Đèn cồn / bếp nhiệt mô phỏng có núm chỉnh nhiệt độ',
      'Đĩa thủy tinh / nắp kim loại đặt nghiêng ở trên',
      'Khay đá viên làm lạnh đĩa',
      'Cốc hứng nước ngưng tụ'
    ],
    procedureSteps: [
      'Quan sát bình nước khi chưa đun: nước vẫn bay hơi nhưng rất chậm.',
      'Tăng mức nguồn nhiệt và quan sát hơi nước bốc lên nhiều hơn, mực nước trong bình giảm dần.',
      'Điều chỉnh mức làm lạnh của đĩa đặt phía trên luồng hơi nước.',
      'Quan sát mặt dưới của đĩa lạnh: các hạt sương nước tí hon tụ lại thành giọt nước lớn rơi vào cốc hứng.'
    ],
    safetyWarning: 'CẢNH BÁO AN TOÀN: Đây là mô phỏng an toàn trên máy tính. Trong thực tế, nước sôi và hơi nước rất nóng có thể gây bỏng nghiêm trọng, học sinh KHÔNG ĐƯỢC tự ý đun nước sôi tại nhà mà không có người lớn giám sát.',
    predictionOptions: [
      {
        id: 'pred_1',
        text: 'Hơi nước gặp mặt đĩa lạnh sẽ biến mất hoàn toàn vào không khí.',
        isCorrect: false,
        explanation: 'Hơi nước không biến mất mà sẽ thay đổi thể trạng khi hạ nhiệt độ.'
      },
      {
        id: 'pred_2',
        text: 'Hơi nước gặp mặt đĩa lạnh sẽ ngưng tụ lại thành các giọt nước lỏng.',
        isCorrect: true,
        explanation: 'Chính xác! Gặp lạnh, hơi nước tỏa nhiệt và ngưng tụ thành nước lỏng.'
      },
      {
        id: 'pred_3',
        text: 'Đĩa lạnh sẽ bị nứt và biến thành hơi nước theo.',
        isCorrect: false,
        explanation: 'Đĩa lạnh chỉ làm nhiệm vụ hạ nhiệt độ luồng hơi nước.'
      }
    ],
    postQuestions: [
      {
        id: 'q1',
        question: 'Hiện tượng nước từ trong bình bay lên không trung dưới dạng hơi được gọi là gì?',
        options: [
          'Sự ngưng tụ',
          'Sự đông đặc',
          'Sự bay hơi (hoặc bốc hơi)',
          'Sự nóng chảy'
        ],
        correctIndex: 2,
        explanation: 'Hiện tượng chất lỏng chuyển thành thể khí (hơi) gọi là sự bay hơi.'
      },
      {
        id: 'q2',
        question: 'Tại sao lại xuất hiện các giọt nước đọng dưới đáy đĩa lạnh?',
        options: [
          'Vì đĩa bị thủng làm nước đá rò rỉ xuống.',
          'Vì hơi nước nóng gặp bề mặt lạnh của đĩa bị giảm nhiệt độ và ngưng tụ lại thành giọt nước.',
          'Vì không khí xung quanh biến thành nước ép vào đĩa.',
          'Do nhiệt độ đĩa quá cao.'
        ],
        correctIndex: 1,
        explanation: 'Hơi nước gặp lạnh bị mất nhiệt, chuyển thể từ thể khí sang thể lỏng (sự ngưng tụ).'
      }
    ],
    scientificConclusion: 'Nước chuyển từ thể lỏng sang thể khí gọi là sự bay hơi (xảy ra nhanh hơn ở nhiệt độ cao). Hơi nước gặp lạnh chuyển thành thể lỏng gọi là sự ngưng tụ. Đây là hai quá trình quan trọng trong vòng tuần hoàn của nước trong tự nhiên.',
    realWorldApplication: {
      title: 'Ứng dụng: Mây, Mưa và Nắp nồi cơm điện',
      scenario: 'Khi mẹ nấu cơm hoặc canh, mở nắp vung ra ta thấy có rất nhiều giọt nước đọng trên nắp vung và nhỏ xuống.',
      question: 'Tại sao trên nắp vung lại có những giọt nước đó?',
      answer: 'Hơi nước từ nồi bốc lên gặp nắp vung có nhiệt độ thấp hơn bên trong nồi nên đã ngưng tụ lại thành các giọt nước.'
    }
  },
  {
    id: 'anh-sang-truyen-nhu-the-nao',
    title: 'Ánh sáng truyền như thế nào?',
    englishTitle: 'How Does Light Travel?',
    topicId: 'anh-sang-am-thanh',
    grade: 4,
    durationMinutes: 15,
    difficulty: 'Dễ',
    thumbnailUrl: './images/hero_smart_science_lab_1791767458426.jpg',
    description: 'Khám phá sự truyền thẳng của ánh sáng, di chuyển vật chắn sáng và màn hứng để quan sát sự tạo thành bóng tối và bóng nửa tối.',
    objective: 'Nhận biết ánh sáng truyền theo đường thẳng trong môi trường đồng tính và trong suốt; hiểu được nguyên nhân tạo ra bóng tối phía sau vật cản.',
    inquiryQuestion: 'Khi bật đèn pin chiếu vào một vật cản, ánh sáng có đi uốn lượn vòng qua vật đó được không? Bóng tối được tạo ra như thế nào?',
    backgroundKnowledge: 'Trong không khí đồng tính, ánh sáng truyền theo đường thẳng. Khi gặp vật cản sáng, ánh sáng không thể xuyên qua được, phía sau vật cản sẽ tạo thành vùng bóng tối.',
    equipment: [
      'Nguồn sáng (Đèn pin hoặc đèn chiếu có thể bật/tắt)',
      'Vật cản sáng (Tấm bìa hình tròn, khối hộp hoặc quả bóng)',
      'Vật cho ánh sáng truyền qua một phần (Tấm kính mờ) và trong suốt (Tấm kính trong)',
      'Màn chắn hứng ánh sáng (Màn trắng có vạch đo)'
    ],
    procedureSteps: [
      'Bật công tắc nguồn sáng chiếu về phía màn hứng.',
      'Đặt vật cản sáng vào giữa nguồn sáng và màn hứng.',
      'Quan sát vệt bóng đen xuất hiện trên màn hứng.',
      'Di chuyển vật cản lại gần hoặc ra xa nguồn sáng để quan sát kích thước của bóng thay đổi.',
      'Thay vật cản bằng tấm kính trong suốt và quan sát sự khác biệt.'
    ],
    safetyWarning: 'Không bao giờ chiếu đèn pin có cường độ sáng mạnh trực tiếp vào mắt bạn bè.',
    predictionOptions: [
      {
        id: 'pred_1',
        text: 'Ánh sáng có thể uốn cong vòng qua vật cản nên phía sau không có bóng tối.',
        isCorrect: false,
        explanation: 'Ánh sáng truyền theo đường thẳng, không thể tự uốn cong qua vật cản trong không khí.'
      },
      {
        id: 'pred_2',
        text: 'Ánh sáng truyền theo đường thẳng, gặp vật cản sẽ bị chặn lại tạo ra bóng tối phía sau.',
        isCorrect: true,
        explanation: 'Chính xác! Do ánh sáng truyền thẳng nên phần phía sau vật cản không nhận được ánh sáng.'
      },
      {
        id: 'pred_3',
        text: 'Bóng tối xuất hiện do nguồn sáng hút bóng đen về phía mình.',
        isCorrect: false,
        explanation: 'Bóng tối đơn giản là vùng không nhận được ánh sáng từ nguồn sáng chiếu tới.'
      }
    ],
    postQuestions: [
      {
        id: 'q1',
        question: 'Khi ta đưa vật cản lại GẦN nguồn sáng hơn, kích thước bóng trên màn sẽ như thế nào?',
        options: [
          'Bóng tối to hơn vì vật cản che chắn một góc chùm sáng rộng hơn.',
          'Bóng tối nhỏ lại.',
          'Bóng tối giữ nguyên không thay đổi.',
          'Bóng tối biến mất thành vệt sáng.'
        ],
        correctIndex: 0,
        explanation: 'Càng gần nguồn sáng, góc chùm sáng bị chắn càng lớn nên bóng chiếu lên màn càng phóng to.'
      },
      {
        id: 'q2',
        question: 'Nếu thay vật cản bằng một tấm kính thủy tinh trong suốt, trên màn sẽ xuất hiện gì?',
        options: [
          'Một bóng đen hoàn toàn như cũ.',
          'Ánh sáng xuyên qua tấm kính và chiếu sáng lên màn, hầu như không tạo thành bóng tối.',
          'Màn sẽ bị vỡ.',
          'Màn chuyển sang màu đỏ rực.'
        ],
        correctIndex: 1,
        explanation: 'Thủy tinh trong suốt cho hầu hết ánh sáng truyền thẳng qua nên không tạo ra vùng bóng tối rõ rệt.'
      }
    ],
    scientificConclusion: 'Ánh sáng truyền theo đường thẳng trong không khí. Khi ánh sáng chiếu vào vật cản sáng, phần phía sau vật cản không nhận được ánh sáng chiếu tới sẽ tạo thành bóng tối.',
    realWorldApplication: {
      title: 'Ứng dụng: Trò chơi Múa rối bóng & Đồng hồ mặt trời',
      scenario: 'Nghệ thuật múa rối bóng dân gian sử dụng một nguồn sáng phía sau các con rối bằng da để in bóng hình sinh động lên màn vải trắng.',
      question: 'Thời xưa khi chưa có đồng hồ, người ta dựa vào bóng của chiếc cọc dưới ánh nắng Mặt Trời để làm gì?',
      answer: 'Người xưa làm ra "Đồng hồ Mặt Trời": khi Mặt Trời di chuyển từ Đông sang Tây, bóng của chiếc cọc quay tròn trên mặt đồng hồ giúp nhận biết giờ giấc trong ngày.'
    }
  },
  {
    id: 'mach-dien-don-gian',
    title: 'Mạch điện đơn giản',
    englishTitle: 'Simple Electric Circuit',
    topicId: 'nang-luong',
    grade: 4,
    durationMinutes: 15,
    difficulty: 'Trung bình',
    thumbnailUrl: './images/hero_smart_science_lab_1791767458426.jpg',
    description: 'Lắp ráp pin 1.5V, dây dẫn, công tắc và bóng đèn để tạo thành một mạch điện kín làm bóng đèn phát sáng.',
    objective: 'Biết lắp ráp một mạch điện thắp sáng đơn giản; hiểu được điều kiện để bóng đèn sáng là mạch điện phải kín và có nguồn điện.',
    inquiryQuestion: 'Cần nối các dây dẫn như thế nào giữa pin, bóng đèn và công tắc để đèn có thể bật và tắt theo ý muốn?',
    backgroundKnowledge: 'Dòng điện chạy từ cực dương qua dây dẫn, thiết bị tiêu thụ điện (bóng đèn), công tắc rồi về cực âm của nguồn điện (pin). Mạch phải là mạch kín thì dòng điện mới chạy qua được.',
    equipment: [
      'Pin tiểu 1.5V có cực dương (+) và cực âm (-)',
      'Bóng đèn sợi đốt nhỏ gắn đui đèn có 2 chốt cắm',
      'Công tắc đóng/mở (khóa K)',
      '3 đoạn dây dẫn điện bọc nhựa có kẹp cá sấu ở 2 đầu'
    ],
    procedureSteps: [
      'Nối một dây từ cực dương (+) của pin tới một chốt của công tắc.',
      'Nối dây thứ hai từ chốt còn lại của công tắc tới chốt thứ nhất của đui đèn.',
      'Nối dây thứ ba từ chốt thứ hai của đui đèn về cực âm (-) của pin.',
      'Đóng công tắc lại để khép kín mạch điện và quan sát bóng đèn bừng sáng.',
      'Mở công tắc hoặc tháo rời một đầu dây để kiểm tra hiện tượng mạch hở.'
    ],
    safetyWarning: 'LƯU Ý AN TOÀN ĐIỆN: Thí nghiệm này sử dụng nguồn pin điện áp thấp 1.5V rất an toàn. Tuyệt đối KHÔNG ĐƯỢC dùng dây dẫn cắm vào ổ điện 220V trong nhà vì dòng điện lưới cực kỳ nguy hiểm, có thể gây giật chết người!',
    predictionOptions: [
      {
        id: 'pred_1',
        text: 'Chỉ cần nối một dây duy nhất từ cực dương của pin vào bóng đèn là đèn sẽ tự sáng.',
        isCorrect: false,
        explanation: 'Mạch phải kín và nối đủ cả hai cực của pin thì dòng điện mới khép kín được.'
      },
      {
        id: 'pred_2',
        text: 'Cần nối đủ các dây tạo thành một vòng khép kín từ cực dương về cực âm và đóng công tắc thì đèn mới sáng.',
        isCorrect: true,
        explanation: 'Chính xác! Dòng điện chỉ chạy được trong mạch điện kín.'
      },
      {
        id: 'pred_3',
        text: 'Bóng đèn sẽ sáng ngay cả khi công tắc đang mở.',
        isCorrect: false,
        explanation: 'Khi công tắc mở, mạch bị hở nên dòng điện bị ngắt quãng, đèn không thể sáng.'
      }
    ],
    postQuestions: [
      {
        id: 'q1',
        question: 'Khi mở công tắc (mạch hở), tại sao bóng đèn lại tắt?',
        options: [
          'Vì pin hết điện ngay lập tức.',
          'Vì dòng điện bị ngắt quãng, không tạo thành đường dẫn khép kín qua bóng đèn.',
          'Vì bóng đèn bị cháy dây tóc.',
          'Vì công tắc đã hút hết điện tích.'
        ],
        correctIndex: 1,
        explanation: 'Dòng điện chỉ có thể chạy qua khi mạch điện hoàn toàn khép kín.'
      },
      {
        id: 'q2',
        question: 'Nếu chèn một mẩu gỗ khô vào giữa đoạn dây dẫn bị đứt, bóng đèn có sáng lại không?',
        options: [
          'Có, vì gỗ dẫn điện rất tốt.',
          'Không, vì gỗ khô là vật cách điện, không cho dòng điện chạy qua.',
          'Đèn sẽ nhấp nháy liên tục.',
          'Đèn sẽ đổi màu sang màu xanh.'
        ],
        correctIndex: 1,
        explanation: 'Gỗ khô là chất cách điện nên không thể nối kín dòng điện.'
      }
    ],
    scientificConclusion: 'Một mạch điện thắp sáng đơn giản gồm nguồn điện (pin), bóng đèn, dây dẫn và công tắc. Đèn chỉ sáng khi mạch điện kín và có dòng điện chạy qua.',
    realWorldApplication: {
      title: 'Ứng dụng: Chiếc đèn pin cầm tay',
      scenario: 'Đèn pin cầm tay ở nhà em có nút gạt bật/tắt ở thân đèn.',
      question: 'Khi em gạt nút bật đèn pin, thao tác đó thực chất đang làm gì trong mạch điện?',
      answer: 'Thao tác đó đóng tiếp điểm kim loại bên trong lại, biến mạch hở thành mạch kín giúp dòng điện từ pin chạy qua bóng LED làm đèn phát sáng.'
    }
  },
  {
    id: 'am-thanh-tao-ra-nhu-the-nao',
    title: 'Âm thanh được tạo ra như thế nào?',
    englishTitle: 'How is Sound Produced?',
    topicId: 'anh-sang-am-thanh',
    grade: 4,
    durationMinutes: 15,
    difficulty: 'Dễ',
    thumbnailUrl: './images/hero_smart_science_lab_1791767458426.jpg',
    description: 'Gõ lên mặt trống có rải hạt gạo hoặc gảy dây đàn ghi-ta để quan sát sự rung động sinh ra âm thanh.',
    objective: 'Nhận biết được âm thanh được phát ra khi các vật rung động; độ mạnh yếu của dao động quyết định độ to nhỏ của âm thanh.',
    inquiryQuestion: 'Khi một vật phát ra âm thanh, bản thân vật đó có đang đứng yên bất động không? Làm sao để nhìn thấy được sự rung động đó?',
    backgroundKnowledge: 'Mọi âm thanh phát ra đều do các vật dao động (rung động). Khi ta gõ trống, mặt trống rung lên làm rung các hạt gạo bên trên và truyền dao động qua không khí tới màng nhĩ của tai.',
    equipment: [
      'Mặt trống da căng phẳng',
      'Một nhúm hạt gạo nhỏ rải trên mặt trống',
      'Dùi gõ trống có điều chỉnh lực đập',
      'Dây đàn ghi-ta căng với chốt căng dây',
      'Màn hình hiện sóng âm thanh mô phỏng'
    ],
    procedureSteps: [
      'Rải đều một số hạt gạo lên trên mặt trống đang đứng yên.',
      'Dùng dùi gõ nhẹ vào mặt trống: quan sát hạt gạo nảy nhẹ và lắng nghe tiếng trống trầm nhẹ.',
      'Dùng dùi gõ mạnh hơn vào mặt trống: quan sát hạt gạo nhảy cao hơn và âm thanh to hơn.',
      'Dùng bàn tay chạm nhẹ và giữ chặt mặt trống khi đang kêu: quan sát âm thanh tắt ngay lập tức.',
      'Chuyển sang gảy dây đàn ghi-ta và quan sát bóng mờ của dây đàn đang rung qua lại.'
    ],
    safetyWarning: 'Không gõ dùi quá sát tai bạn để bảo vệ thính giác.',
    predictionOptions: [
      {
        id: 'pred_1',
        text: 'Vật phát ra âm thanh hoàn toàn đứng yên, không hề có sự chuyển động nào.',
        isCorrect: false,
        explanation: 'Thực tế mọi nguồn âm đều đang dao động rất nhanh.'
      },
      {
        id: 'pred_2',
        text: 'Vật phát ra âm thanh đều đang rung động (dao động) qua lại.',
        isCorrect: true,
        explanation: 'Chính xác! Rung động là nguyên nhân trực tiếp sinh ra âm thanh.'
      },
      {
        id: 'pred_3',
        text: 'Âm thanh tự nhiên sinh ra từ không khí mà không cần vật thể nào tác động.',
        isCorrect: false,
        explanation: 'Phải có nguồn âm dao động truyền sóng tới môi trường.'
      }
    ],
    postQuestions: [
      {
        id: 'q1',
        question: 'Tại sao các hạt gạo trên mặt trống lại nảy lên khi ta gõ trống?',
        options: [
          'Vì gió thổi từ dùi trống làm bay gạo.',
          'Vì mặt trống dao động rung lên xuống đẩy các hạt gạo nảy lên.',
          'Vì các hạt gạo có lò xo tự nhảy.',
          'Vì mặt trống bị thủng.'
        ],
        correctIndex: 1,
        explanation: 'Sự rung động rất nhanh của mặt trống đã truyền động năng đẩy các hạt gạo nảy múa trên bề mặt.'
      },
      {
        id: 'q2',
        question: 'Khi ta đặt tay áp chặt vào mặt trống đang rung, điều gì sẽ xảy ra?',
        options: [
          'Tiếng trống kêu to hơn gấp đôi.',
          'Mặt trống ngừng rung động và âm thanh lập tức tắt hẳn.',
          'Trống sẽ tự đổi thành tiếng đàn.',
          'Tay ta bị hút dính vào trống.'
        ],
        correctIndex: 1,
        explanation: 'Bàn tay triệt tiêu dao động của mặt trống, khi vật ngừng rung động thì âm thanh cũng ngừng phát ra.'
      }
    ],
    scientificConclusion: 'Âm thanh do các vật rung động phát ra. Khi vật rung động mạnh thì âm thanh phát ra to; khi vật rung động yếu thì âm thanh phát ra nhỏ; khi vật ngừng rung động thì âm thanh tắt.',
    realWorldApplication: {
      title: 'Ứng dụng: Thanh quản của con người khi nói chuyện',
      scenario: 'Khi em đặt hai ngón tay nhẹ nhàng lên phía trước cổ họng và ngân nga một câu hát: "Aaaa..."',
      question: 'Em cảm nhận thấy điều gì ở cổ họng và điều đó chứng minh điều gì?',
      answer: 'Em sẽ cảm thấy cổ họng đang rung lên nhè nhẹ. Đó chính là dây thanh quản trong cổ họng đang rung động để tạo ra giọng nói và tiếng hát của em.'
    }
  },
  {
    id: 'cay-can-gi-de-song',
    title: 'Cây cần gì để sống và phát triển?',
    englishTitle: 'What Do Plants Need to Live?',
    topicId: 'thuc-vat-dong-vat',
    grade: 4,
    durationMinutes: 20,
    difficulty: 'Trung bình',
    thumbnailUrl: './images/hero_smart_science_lab_1791767458426.jpg',
    description: 'Mô phỏng so sánh 4 chậu cây đậu với 4 điều kiện: đủ điều kiện, thiếu nước, thiếu ánh sáng và thiếu không khí trong 10 ngày.',
    objective: 'Nêu được các yếu tố cần thiết cho sự sống và phát triển của thực vật: nước, ánh sáng, không khí, chất khoáng và nhiệt độ thích hợp.',
    inquiryQuestion: 'Nếu một cây có đầy đủ ánh sáng và không khí nhưng bị bỏ quên không tưới nước trong 10 ngày, điều gì sẽ xảy ra với cây?',
    backgroundKnowledge: 'Thực vật là sinh vật sống tự dưỡng. Để quang hợp, hô hấp và sinh trưởng, cây xanh cần có ánh sáng mặt trời, nước, chất khoáng từ đất, không khí (khí cacbônic và ôxi) và nhiệt độ thích hợp.',
    equipment: [
      'Chậu A (đối chứng): Đủ nước, đặt nơi có đủ ánh sáng mặt trời và không khí thoáng đãng',
      'Chậu B: Đủ ánh sáng và không khí nhưng KHÔNG TƯỚI NƯỚC',
      'Chậu C: Đủ nước và không khí nhưng ĐẶT TRONG HỘP KÍN TỐI (Thiếu ánh sáng)',
      'Chậu D: Đủ nước và ánh sáng nhưng BỌC KÍN TÚI NILON TRONG SUỐT (Thiếu không khí trao đổi)',
      'Thanh trượt thời gian mô phỏng từ Ngày 1 đến Ngày 10'
    ],
    procedureSteps: [
      'Quan sát 4 chậu cây vào Ngày 1.',
      'Kéo thanh trượt thời gian sang Ngày 3, Ngày 6 và Ngày 10.',
      'Quan sát sự thay đổi màu sắc lá, chiều cao thân và độ tươi tốt của từng chậu cây.',
      'Ghi nhận kết quả vào bảng so sánh điều kiện sinh trưởng.'
    ],
    safetyWarning: 'Đây là mô phỏng đơn giản, kết quả thực tế có thể khác. Ví dụ, cây xương rồng chịu hạn tốt hơn nhiều so với cây đậu.',
    predictionOptions: [
      {
        id: 'pred_1',
        text: 'Cây chỉ cần đất là đủ, không cần nước và ánh sáng vẫn phát triển xanh tốt.',
        isCorrect: false,
        explanation: 'Đất cung cấp chất khoáng và giữ rễ, nhưng không thể thay thế nước và ánh sáng quang hợp.'
      },
      {
        id: 'pred_2',
        text: 'Cây cần cả nước, ánh sáng, không khí và nhiệt độ phù hợp; thiếu một trong các yếu tố cây sẽ còi cọc hoặc chết.',
        isCorrect: true,
        explanation: 'Chính xác! Mọi yếu tố đều đóng vai trò thiết yếu cho sự sống của cây.'
      },
      {
        id: 'pred_3',
        text: 'Chậu cây bọc túi kín sẽ lớn nhanh nhất vì được giữ ấm tuyệt đối.',
        isCorrect: false,
        explanation: 'Bọc kín làm cây thiếu không khí trao đổi nên cây lớn chậm và kém tươi.'
      }
    ],
    postQuestions: [
      {
        id: 'q1',
        question: 'Ở chậu B (không được tưới nước), cây có hiện tượng gì sau 10 ngày?',
        options: [
          'Cây vẫn tươi xanh như bình thường.',
          'Lá cây héo rũ, khô quắt, thân gục xuống và cây chết dần vì thiếu nước.',
          'Cây ra rất nhiều hoa quả to.',
          'Cây biến thành màu xanh đậm hơn.'
        ],
        correctIndex: 1,
        explanation: 'Nước chiếm phần lớn tế bào thực vật và vận chuyển chất dinh dưỡng; không có nước cây sẽ héo và chết.'
      },
      {
        id: 'q2',
        question: 'Ở chậu C (trong hộp tối, thiếu ánh sáng), lá cây có màu gì khác biệt?',
        options: [
          'Lá có màu xanh mướt tuyệt đẹp.',
          'Lá bị nhạt màu chuyển sang màu vàng úa, thân cây vống dài khẳng khiu.',
          'Lá biến thành màu tím than.',
          'Lá phát sáng trong đêm.'
        ],
        correctIndex: 1,
        explanation: 'Không có ánh sáng, cây không thể tổng hợp chất diệp lục nên lá bị vàng úa và vống cao tìm ánh sáng.'
      }
    ],
    scientificConclusion: 'Thực vật cần có đủ nước, chất khoáng, không khí, ánh sáng và nhiệt độ thích hợp để sống và phát triển bình thường. Nếu thiếu một trong các yếu tố đó, cây sẽ còi cọc, yếu ớt hoặc bị chết.',
    realWorldApplication: {
      title: 'Vận dụng: Chăm sóc bồn hoa và cây cảnh trường học',
      scenario: 'Sau kỳ nghỉ hè trở lại lớp, các em thấy chậu hoa cúc ở góc hiên trường học bị héo úa, đất khô nứt nẻ.',
      question: 'Em hãy nêu những việc cần làm ngay để cứu sống và chăm sóc bồn hoa phát triển xanh tốt trở lại?',
      answer: 'Cần nhặt bỏ lá khô úa, xới nhẹ lớp đất xốp, tưới nước vừa đủ cho cây thấm đều và di chuyển chậu cây ra vị trí có ánh nắng buổi sáng chan hòa.'
    }
  }
];

export const INITIAL_QUIZZES: Quiz[] = [
  {
    id: 'quiz_khong_khi_nuoc',
    title: 'Thử thách: Khám phá Không khí và Nước',
    topicId: 'khong-khi-nuoc',
    durationMinutes: 10,
    description: 'Kiểm tra kiến thức về tính chất không khí, sự chiếm chỗ và vòng tuần hoàn nước.',
    questions: [
      {
        id: 'qz_1',
        type: 'multiple_choice',
        question: 'Hiện tượng nào sau đây chứng minh không khí có ở xung quanh ta?',
        options: [
          'Lá cây rung rinh khi có gió thổi.',
          'Bơm phao bơi căng phồng lên.',
          'Nhúng chiếc cốc rỗng úp ngược vào nước thấy bọt khí sủi lên.',
          'Cả ba hiện tượng trên.'
        ],
        correctIndex: 3,
        explanation: 'Cả 3 hiện tượng đều chứng minh sự hiện diện và chiếm chỗ của không khí.'
      },
      {
        id: 'qz_2',
        type: 'true_false',
        question: 'Nước chuyển từ thể lỏng sang thể khí được gọi là sự ngưng tụ.',
        isTrue: false,
        explanation: 'Sai! Nước từ thể lỏng sang thể khí gọi là sự bay hơi. Từ thể khí sang thể lỏng mới gọi là sự ngưng tụ.'
      },
      {
        id: 'qz_3',
        type: 'multiple_choice',
        question: 'Tại sao khi hít thở sâu, lồng ngực của em phập phồng nở ra?',
        options: [
          'Vì không khí đi vào phổi và chiếm chỗ làm phổi giãn nở.',
          'Vì thức ăn đẩy lồng ngực ra.',
          'Vì tim đập mạnh hơn bình thường.',
          'Vì xương sườn tự uốn cong.'
        ],
        correctIndex: 0,
        explanation: 'Không khí hít vào chiếm chỗ trong các phế nang phổi làm lồng ngực nở rộng ra.'
      }
    ]
  },
  {
    id: 'quiz_nang_luong_am_thanh',
    title: 'Thử thách: Ánh sáng, Âm thanh và Điện',
    topicId: 'anh-sang-am-thanh',
    durationMinutes: 10,
    description: 'Thử tài hiểu biết về đường truyền ánh sáng, bóng tối và dao động âm thanh.',
    questions: [
      {
        id: 'qz_4',
        type: 'multiple_choice',
        question: 'Trong không khí đồng tính, ánh sáng truyền theo đường nào?',
        options: [
          'Đường cong lượn sóng.',
          'Đường gấp khúc chữ chi.',
          'Đường thẳng.',
          'Đường tròn xoắn ốc.'
        ],
        correctIndex: 2,
        explanation: 'Ánh sáng luôn truyền theo đường thẳng trong môi trường trong suốt và đồng tính.'
      },
      {
        id: 'qz_5',
        type: 'true_false',
        question: 'Vật phát ra âm thanh to khi vật đó dao động rung càng mạnh.',
        isTrue: true,
        explanation: 'Đúng! Biên độ dao động càng lớn thì âm thanh phát ra càng to.'
      },
      {
        id: 'qz_6',
        type: 'multiple_choice',
        question: 'Bóng tối xuất hiện ở đâu?',
        options: [
          'Ở phía trước vật cản sáng, hướng về phía nguồn sáng.',
          'Ở phía sau vật cản sáng, nơi không nhận được ánh sáng từ nguồn sáng.',
          'Ở bên trong nguồn sáng.',
          'Ở bất cứ vị trí nào tùy thích.'
        ],
        correctIndex: 1,
        explanation: 'Phần phía sau vật cản sáng không nhận được ánh sáng chiếu tới tạo nên vùng bóng tối.'
      }
    ]
  }
];

export const INITIAL_VIDEOS: ScienceVideo[] = [
  {
    id: 'vid_1',
    title: 'Khám phá: Tại sao cốc úp trong nước không bị ướt giấy?',
    thumbnailUrl: './images/exp_air_pressure_1791767471782.jpg',
    topicId: 'khong-khi-nuoc',
    description: 'Video phóng sự thí nghiệm vui về áp suất và tính chiếm chỗ của không khí trong đời sống.',
    level: 'Lớp 4',
    preQuestion: 'Em hãy quan sát xem người dẫn chương trình làm thế nào để mẩu giấy luôn khô ráo?',
    postQuestion: 'Tại sao khi nghiêng chiếc cốc lại có tiếng lục bục và bong bóng nổi lên?',
    videoUrl: '',
    isFavorite: false
  },
  {
    id: 'vid_2',
    title: 'Vòng tuần hoàn diệu kỳ của Nước trong tự nhiên',
    thumbnailUrl: './images/exp_water_cycle_1791767495614.jpg',
    topicId: 'khong-khi-nuoc',
    description: 'Hoạt hình giải thích sự bốc hơi từ biển cả, ngưng tụ thành mây và rơi xuống thành mưa ngọt.',
    level: 'Lớp 4',
    preQuestion: 'Nước mưa trên trời rơi xuống có nguồn gốc từ đâu bay lên?',
    postQuestion: 'Hai quá trình vật lý nào diễn ra luân phiên trong chu trình của nước?',
    videoUrl: '',
    isFavorite: false
  },
  {
    id: 'vid_3',
    title: 'Bí ẩn của Nam châm: Lực từ kỳ thú',
    thumbnailUrl: './images/exp_magnet_materials_1791767483863.jpg',
    topicId: 'nang-luong',
    description: 'Quan sát các mạt sắt tạo thành những đường cong kỳ ảo xung quanh 2 cực của thanh nam châm.',
    level: 'Lớp 4',
    preQuestion: 'Hai cực cùng tên của nam châm để gần nhau sẽ hút hay đẩy nhau?',
    postQuestion: 'Các vật bằng nhôm và đồng có bị nam châm hút không?',
    videoUrl: '',
    isFavorite: false
  }
];

// Đếm số thí nghiệm thật sự có trong mỗi chủ đề (không ghi số cố định)
export const countExperimentsByTopic = (topicId: TopicId): number =>
  EXPERIMENTS_DATA.filter((e) => e.topicId === topicId).length;
