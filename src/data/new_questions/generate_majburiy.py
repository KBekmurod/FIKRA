import json
import os

questions = [
    {
        "subject": "majburiy_onatili",
        "block": "majburiy",
        "topic": "Fonetika",
        "question": "Qaysi qatordagi so'zlarning barchasida faqat jarangli undoshlar ishtirok etgan?",
        "options": ["davr, bino, g'o'za", "shahar, kitob, olcha", "daraxt, shox, barg", "qalam, daftar, ruchka"],
        "answer": 0,
        "explanation": "'davr' (d, v, r), 'bino' (b, n), 'g'o'za' (g', z) so'zlaridagi barcha undoshlar jarangli hisoblanadi."
    },
    {
        "subject": "majburiy_onatili",
        "block": "majburiy",
        "topic": "Fonetika",
        "question": "Qaysi qatorda faqat jarangsiz undoshlar qatnashgan so'z berilgan?",
        "options": ["paxta", "daftar", "qalam", "bulut"],
        "answer": 0,
        "explanation": "'paxta' so'zidagi p, x, t undoshlari barchasi jarangsizdir."
    },
    {
        "subject": "majburiy_onatili",
        "block": "majburiy",
        "topic": "Fonetika",
        "question": "Qaysi so'zda unlilar yonma-yon kelgan?",
        "options": ["shuur", "mashina", "daraxt", "kitobxon"],
        "answer": 0,
        "explanation": "'shuur' so'zida 'u' unlilari yonma-yon kelgan."
    },
    {
        "subject": "majburiy_onatili",
        "block": "majburiy",
        "topic": "Fonetika",
        "question": "Qaysi qatordagi so'zda urg'u birinchi bo'g'inga tushadi?",
        "options": ["hamisha", "hozir", "kitob", "maktab"],
        "answer": 1,
        "explanation": "'hozir' so'zida urg'u birinchi bo'g'inga (ho-zir) tushadi."
    },
    {
        "subject": "majburiy_onatili",
        "block": "majburiy",
        "topic": "Fonetika",
        "question": "Qaysi so'zda tovush tushishi kuzatiladi?",
        "options": ["shahar - shahri", "kitob - kitobim", "daftar - daftari", "qalam - qalami"],
        "answer": 0,
        "explanation": "'shahar' so'ziga egalik qo'shimchasi qo'shilganda 'a' unlisi tushib qoladi (shahri)."
    },
    {
        "subject": "majburiy_onatili",
        "block": "majburiy",
        "topic": "Fonetika",
        "question": "Qaysi so'zda tovush ortishi kuzatiladi?",
        "options": ["parvo - parvoyim", "shahar - shahrim", "ona - onam", "ota - otam"],
        "answer": 0,
        "explanation": "'parvo' so'ziga 'im' egalik qo'shimchasi qo'shilganda 'y' tovushi orttiriladi."
    },
    {
        "subject": "majburiy_onatili",
        "block": "majburiy",
        "topic": "Fonetika",
        "question": "Qaysi qatorda tutuq belgisi (') unlini undoshdan ajratish uchun ishlatilgan?",
        "options": ["san'at", "mo''tabar", "a'lo", "ne'mat"],
        "answer": 0,
        "explanation": "'san'at' so'zida tutuq belgisi unli 'a' ni undosh 'n' dan ajratib ko'rsatish uchun xizmat qiladi."
    },
    {
        "subject": "majburiy_onatili",
        "block": "majburiy",
        "topic": "Fonetika",
        "question": "O'zbek tilida nechta unli tovush bor?",
        "options": ["6 ta", "5 ta", "8 ta", "9 ta"],
        "answer": 0,
        "explanation": "O'zbek tilida 6 ta unli tovush mavjud: a, e, i, o, u, o'."
    },
    {
        "subject": "majburiy_onatili",
        "block": "majburiy",
        "topic": "Fonetika",
        "question": "Lablangan unlilar qaysi qatorda to'g'ri ko'rsatilgan?",
        "options": ["o, u, o'", "a, i, e", "i, e, a", "o, a, i"],
        "answer": 0,
        "explanation": "Lablar ishtirokiga ko'ra o, u, o' unlilari lablangan unlilar hisoblanadi."
    },
    {
        "subject": "majburiy_onatili",
        "block": "majburiy",
        "topic": "Fonetika",
        "question": "Qaysi qatordagi barcha so'zlar yopiq bo'g'in bilan tugagan?",
        "options": ["maktab, daftar, kitob", "ona, bola, dala", "shahar, daryo, bino", "qalam, ota, osmon"],
        "answer": 0,
        "explanation": "Maktab (tab), daftar (tar), kitob (tob) - barchasining oxirgi bo'g'ini undosh bilan tugagan (yopiq)."
    },
    {
        "subject": "majburiy_onatili",
        "block": "majburiy",
        "topic": "Fonetika",
        "question": "Qaysi undosh tovushlar til orqa undoshlari deyiladi?",
        "options": ["k, g, ng", "p, b, m", "t, d, n", "sh, ch, j"],
        "answer": 0,
        "explanation": "k, g, ng undoshlari hosil bo'lish o'rniga ko'ra til orqa undoshlari hisoblanadi."
    },
    {
        "subject": "majburiy_onatili",
        "block": "majburiy",
        "topic": "Fonetika",
        "question": "Bo'g'iz undoshi qaysi?",
        "options": ["h", "x", "q", "g'"],
        "answer": 0,
        "explanation": "'h' tovushi bo'g'izda hosil bo'ladigan yakkayu yagona undoshdir."
    },
    {
        "subject": "majburiy_onatili",
        "block": "majburiy",
        "topic": "Fonetika",
        "question": "Jarangli undoshlarning jarangsizlashuvi qaysi so'zda kuzatiladi?",
        "options": ["kitob", "daftar", "maktab", "osmon"],
        "answer": 0,
        "explanation": "'kitob' so'zining oxiridagi 'b' tovushi jarangsiz 'p' kabi aytiladi (kitop)."
    },
    {
        "subject": "majburiy_onatili",
        "block": "majburiy",
        "topic": "Fonetika",
        "question": "Qaysi qatorda urg'u so'z oxiriga tushmaydigan so'z berilgan?",
        "options": ["allaqachon", "kitoblar", "kelajak", "talaba"],
        "answer": 0,
        "explanation": "Ravishlarda, xususan 'allaqachon' so'zida urg'u so'z oxiriga emas, o'rtasiga tushadi."
    },
    {
        "subject": "majburiy_onatili",
        "block": "majburiy",
        "topic": "Fonetika",
        "question": "Qaysi so'zda 'ng' bitta tovush (undosh) sifatida kelgan?",
        "options": ["dengiz", "bodring", "tong", "Barchasida"],
        "answer": 3,
        "explanation": "Berilgan barcha so'zlarda (dengiz, bodring, tong) 'ng' bitta til orqa burun undoshi sifatida qatnashgan."
    },
    {
        "subject": "majburiy_onatili",
        "block": "majburiy",
        "topic": "Morfologiya",
        "question": "Qaysi qatordagi so'zlar yasama otlar hisoblanadi?",
        "options": ["ishchi, o'quvchi", "kitob, daftar", "yaxshi, chiroyli", "tez, asta"],
        "answer": 0,
        "explanation": "'ishchi' (ish+chi) va 'o'quvchi' (o'quv+chi) so'z yasovchi qo'shimchalar yordamida yasalgan otlardir."
    },
    {
        "subject": "majburiy_onatili",
        "block": "majburiy",
        "topic": "Morfologiya",
        "question": "Qaysi qatordagi barcha so'zlar sifat turkumiga oid?",
        "options": ["qizil, katta, shirin", "yugurdi, o'qidi, keldi", "olti, yuz, ming", "men, sen, u"],
        "answer": 0,
        "explanation": "Qizil (rang), katta (hajm), shirin (ta'm) barchasi predmetning belgisini bildiruvchi sifatlardir."
    },
    {
        "subject": "majburiy_onatili",
        "block": "majburiy",
        "topic": "Morfologiya",
        "question": "Qanday qo'shimchalar so'zning ma'nosini o'zgartirmay, faqat shaklini o'zgartiradi?",
        "options": ["Shakl yasovchi qo'shimchalar", "So'z yasovchi qo'shimchalar", "O'zak va negizlar", "Faqat kelishik qo'shimchalari"],
        "answer": 0,
        "explanation": "Shakl yasovchi (sintaktik shakl yasovchi) qo'shimchalar so'zni boshqa so'zlarga bog'lashga xizmat qilib, yangi ma'no hosil qilmaydi."
    },
    {
        "subject": "majburiy_onatili",
        "block": "majburiy",
        "topic": "Morfologiya",
        "question": "Sonning ma'no turlari to'g'ri berilgan qatorni toping.",
        "options": ["Miqdor va tartib", "Sifat va xususiyat", "Harakat va holat", "Shaxs va payt"],
        "answer": 0,
        "explanation": "Sonlar asosan ikkita katta guruhga: miqdor (nechta?) va tartib (nechanchi?) sonlarga bo'linadi."
    },
    {
        "subject": "majburiy_onatili",
        "block": "majburiy",
        "topic": "Morfologiya",
        "question": "Qaysi so'z turkumi narsa-buyumning belgisini bildiradi?",
        "options": ["Sifat", "Ot", "Fe'l", "Ravish"],
        "answer": 0,
        "explanation": "Sifat narsa va buyumning rangi, mazasi, shakli, hajmi kabi belgilarini bildiradi."
    },
    {
        "subject": "majburiy_onatili",
        "block": "majburiy",
        "topic": "Morfologiya",
        "question": "Olmosh qaysi so'z turkumlari o'rnida qo'llanila oladi?",
        "options": ["Ot, sifat, son, ravish o'rnida", "Faqat ot o'rnida", "Faqat fe'l o'rnida", "Ot va fe'l o'rnida"],
        "answer": 0,
        "explanation": "Olmoshlar mustaqil so'z turkumlari (ot, sifat, son, ravish) o'rnida ishora yoki olmoshish vazifasida keladi."
    },
    {
        "subject": "majburiy_onatili",
        "block": "majburiy",
        "topic": "Morfologiya",
        "question": "Harakatning qanday, qay holatda bajarilishini bildiruvchi ravishlar qaysilar?",
        "options": ["Holat ravishlari", "Payt ravishlari", "O'rin ravishlari", "Sabab ravishlari"],
        "answer": 0,
        "explanation": "Holat ravishlari ish-harakatning qanday tarzda, qanday holatda bajarilganligini bildiradi."
    },
    {
        "subject": "majburiy_onatili",
        "block": "majburiy",
        "topic": "Morfologiya",
        "question": "Fe'lning qaysi zamon shakli o'tgan zamon ma'nosini bildiradi?",
        "options": ["-di, -gan, -ib", "-moqda, -yotir, -yotibdi", "-a, -y, -ar", "-ajak, -moqchi"],
        "answer": 0,
        "explanation": "-di (yaqin o'tgan zamon), -gan (uzoq o'tgan zamon), -ib (o'tgan zamon) shakllari harakatning oldin bajarilganini bildiradi."
    },
    {
        "subject": "majburiy_onatili",
        "block": "majburiy",
        "topic": "Morfologiya",
        "question": "Ko'makchilar qaysi qatorda to'g'ri berilgan?",
        "options": ["uchun, bilan, sari", "va, ammo, lekin", "oh, voy, e-he", "faqat, hatto, ham"],
        "answer": 0,
        "explanation": "Uchun, bilan, sari kabi yordamchi so'zlar ot va otlashgan so'zlarga qo'shilib, ularni boshqa so'zlarga tobe qilib bog'laydi, bu ko'makchilardir."
    },
    {
        "subject": "majburiy_onatili",
        "block": "majburiy",
        "topic": "Morfologiya",
        "question": "Bog'lovchilarning vazifasi nima?",
        "options": ["Gap bo'laklari va qo'shma gap qismlarini bog'lash", "So'zlarga qo'shimcha ma'no yuklash", "His-hayajonni ifodalash", "Narsaning nomini bildirish"],
        "answer": 0,
        "explanation": "Bog'lovchilar teng va tobe bog'lovchilarga bo'linib, gap bo'laklari va qo'shma gap qismlarini bir-biriga bog'laydi."
    },
    {
        "subject": "majburiy_onatili",
        "block": "majburiy",
        "topic": "Morfologiya",
        "question": "Yuklamalar qaysi qatorda to'g'ri ko'rsatilgan?",
        "options": ["-mi, -chi, -a, faqat", "bilan, uchun, kabi", "va, hamda, ammo", "qarab, tomon, haqida"],
        "answer": 0,
        "explanation": "-mi (so'roq), -chi, -a, faqat (ayiruv-chegaralov) so'z yoki gapga qo'shimcha ma'no yuklaydigan yuklamalardir."
    },
    {
        "subject": "majburiy_onatili",
        "block": "majburiy",
        "topic": "Morfologiya",
        "question": "Harakat nomi shakllari qaysi qatorda to'g'ri berilgan?",
        "options": ["-moq, -ish, -v", "-gan, -digan, -ar", "-b, -ib, -gach", "-di, -yap, -moqda"],
        "answer": 0,
        "explanation": "Harakat nomi harakatni ot kabi atab keladi va -moq (yozmoq), -ish (yozish), -v (o'quv) qo'shimchalari yordamida yasaladi."
    },
    {
        "subject": "majburiy_onatili",
        "block": "majburiy",
        "topic": "Morfologiya",
        "question": "Sifatdosh qaysi so'z turkumi xususiyatlarini o'zida jamlagan?",
        "options": ["Fe'l va sifat", "Fe'l va ot", "Fe'l va ravish", "Sifat va ot"],
        "answer": 0,
        "explanation": "Sifatdosh ham harakatni bildiradi (fe'l belgisi), ham narsaning belgisini bildirib qanday? so'rog'iga javob bo'ladi (sifat belgisi)."
    },
    {
        "subject": "majburiy_onatili",
        "block": "majburiy",
        "topic": "Morfologiya",
        "question": "Ravishdosh qo'shimchalari qaysi qatorda to'g'ri ko'rsatilgan?",
        "options": ["-b, -ib, -gach, -guncha", "-gan, -digan, -ar", "-moq, -ish, -v", "-di, -mish, -di"],
        "answer": 0,
        "explanation": "Ravishdosh asosan asosiy harakatning bajarilish tarzi yoki paytini bildirib keladi va u ko'rsatilgan qo'shimchalar yordamida yasaladi."
    },
    {
        "subject": "majburiy_onatili",
        "block": "majburiy",
        "topic": "Morfologiya",
        "question": "Qaysi gapda 'o'zi' olmoshi belgilash ma'nosida kelgan?",
        "options": ["U o'zining ishini bajardi.", "Bu kitob o'ziga tegishli emas.", "Bu ishlarni o'zim qildim.", "Barcha ishni uning o'zi bajarishi kerak edi."],
        "answer": 3,
        "explanation": "O'z olmoshi ba'zan ta'kid yoki belgilash ma'nosida mustaqil qo'llanadi. 'uning o'zi' urg'u berish xarakteriga ega."
    },
    {
        "subject": "majburiy_onatili",
        "block": "majburiy",
        "topic": "Morfologiya",
        "question": "Chama son yasalish qo'shimchasi qaysi?",
        "options": ["-ta, -tacha", "-inchi", "-ov, -ala", "ikkita-uchta, -larcha"],
        "answer": 0,
        "explanation": "-tacha qo'shimchasi yoki sonlarni takrorlash orqali chama son yasaladi (yuztacha, o'ntacha)."
    },
    {
        "subject": "majburiy_onatili",
        "block": "majburiy",
        "topic": "Morfologiya",
        "question": "Taqsim son qanday yasaladi?",
        "options": ["-tadan", "-ta", "-inchi", "-ov"],
        "answer": 0,
        "explanation": "Taqsim son asosan sanoq sonlarga -tadan (uchtadan, beshtadan) qo'shimchasini qo'shish orqali yasaladi."
    },
    {
        "subject": "majburiy_onatili",
        "block": "majburiy",
        "topic": "Morfologiya",
        "question": "Otning qanday turlari bor?",
        "options": ["Atoqli va turdosh", "Sanoq va tartib", "Asosiy va qo'shimcha", "Holat va payt"],
        "answer": 0,
        "explanation": "Otlar asosan bir turdagi narsalarning umumiy nomi bo'lgan turdosh otlarga va yakka obyektlarga berilgan atoqli otlarga bo'linadi."
    },
    {
        "subject": "majburiy_onatili",
        "block": "majburiy",
        "topic": "Morfologiya",
        "question": "Qaysi qatordagi barcha so'zlar undov so'zlar hisoblanadi?",
        "options": ["oh, bay-bay, o'h-ho' ", "bilan, uchun, sari", "va, ham, ammo", "faqat, hatto, xuddi"],
        "answer": 0,
        "explanation": "Undov so'zlar insonning turli his-hayajonlarini, tuyg'ularini (shodlik, qo'rquv, hayrat) ifodalaydigan so'zlardir."
    },
    {
        "subject": "majburiy_onatili",
        "block": "majburiy",
        "topic": "Morfologiya",
        "question": "Taqlid so'zlar ishtirok etgan qatorni toping.",
        "options": ["Shig'ir-shig'ir, taq-tuq, yarq", "tez-tez, asta-sekin, baland", "oh-voh, iye, voy", "kattakon, qip-qizil, yam-yashil"],
        "answer": 0,
        "explanation": "Taqlid so'zlar tabiatdagi turli tovushlarga (taq-tuq) yoki narsalarning holatiga (yarq) taqlidni bildiradi."
    },
    {
        "subject": "majburiy_onatili",
        "block": "majburiy",
        "topic": "Sintaksis",
        "question": "Ega qaysi so'roqlarga javob bo'ladi?",
        "options": ["Kim?, Nima?, Qayer?", "Qanday?, Qanaqa?", "Nega?, Nima uchun?", "Kimni?, Nimani?"],
        "answer": 0,
        "explanation": "Ega asosan bosh kelishikdagi so'z bo'lib, kim?, nima?, ba'zan qayer? so'roqlariga javob bo'ladi."
    },
    {
        "subject": "majburiy_onatili",
        "block": "majburiy",
        "topic": "Sintaksis",
        "question": "Kesim gapning qaysi bo'lagi hisoblanadi?",
        "options": ["Bosh bo'lagi", "Ikkinchi darajali bo'lagi", "Undalma", "Kirish so'z"],
        "answer": 0,
        "explanation": "Gapning markazi hisoblangan, kesim egaga bog'lanib harakat yoki holatni ifodalaydigan bosh bo'lakdir."
    },
    {
        "subject": "majburiy_onatili",
        "block": "majburiy",
        "topic": "Sintaksis",
        "question": "To'ldiruvchi qaysi so'roqlarga javob bo'ladi?",
        "options": ["Kimni?, Nimani?, Kimga?, Nimaga?", "Kim?, Nima?", "Qanday?, Qaysi?", "Qachon?, Qayerda?"],
        "answer": 0,
        "explanation": "To'ldiruvchi obyektni bildirib tushum, jo'nalish, o'rin-payt, chiqish kelishigi so'roqlariga javob bo'ladi."
    },
    {
        "subject": "majburiy_onatili",
        "block": "majburiy",
        "topic": "Sintaksis",
        "question": "Aniqlovchi qaysi so'roqlarga javob bo'ladi?",
        "options": ["Qanday?, Qaysi?, Kimning?, Nimaning?", "Kim?, Nima?", "Qachon?, Qayerda?", "Nega?, Qancha?"],
        "answer": 0,
        "explanation": "Aniqlovchi otdan anglashilgan narsaning belgisi yoki qarashliligini bildiradi."
    },
    {
        "subject": "majburiy_onatili",
        "block": "majburiy",
        "topic": "Sintaksis",
        "question": "Hol gapda ko'pincha qaysi so'z turkumi bilan ifodalanadi?",
        "options": ["Ravish", "Ot", "Olmosh", "Sifat"],
        "answer": 0,
        "explanation": "Hol ish-harakatning tarzi, payti, o'rni, sababi va maqsadini bildiradi, u ko'pincha ravishlar orqali ifodalanadi."
    },
    {
        "subject": "majburiy_onatili",
        "block": "majburiy",
        "topic": "Sintaksis",
        "question": "Gapning maqsadga ko'ra qanday turlari mavjud?",
        "options": ["Darak, so'roq, buyruq, undov", "Yig'iq, yoyiq", "Sodda, qo'shma", "Egali, egasiz"],
        "answer": 0,
        "explanation": "Gaplar ifodalagan maqsadiga ko'ra darak, so'roq, buyruq va his-hayajon bilan aytilgan undov gaplarga bo'linadi."
    },
    {
        "subject": "majburiy_onatili",
        "block": "majburiy",
        "topic": "Sintaksis",
        "question": "Ikki yoki undan ortiq sodda gapning birlashuvidan qanday gap hosil bo'ladi?",
        "options": ["Qo'shma gap", "Sodda yoyiq gap", "Uyushiq bo'lakli gap", "Murakkab gap"],
        "answer": 0,
        "explanation": "Ikki yoki undan ortiq kesimlik asosiga ega bo'lgan, ohang orqali birlashgan gaplar qo'shma gap deyiladi."
    },
    {
        "subject": "majburiy_onatili",
        "block": "majburiy",
        "topic": "Sintaksis",
        "question": "Bog'langan qo'shma gapda qismlar bir-biriga nima orqali bog'lanadi?",
        "options": ["Teng bog'lovchilar", "Ergashtiruvchi bog'lovchilar", "Faqat ohang", "Ko'makchilar"],
        "answer": 0,
        "explanation": "Bog'langan qo'shma gaplar o'zaro teng bo'lgan qismlardan iborat bo'lib, ular teng bog'lovchilar (va, ammo, lekin) yordamida bog'lanadi."
    },
    {
        "subject": "majburiy_onatili",
        "block": "majburiy",
        "topic": "Sintaksis",
        "question": "Ergashgan qo'shma gapning tarkibi qanday bo'ladi?",
        "options": ["Bosh gap va ergash gap", "Ikki teng gap", "Faqat uyushiq kesimlar", "Bir nechta bosh gap"],
        "answer": 0,
        "explanation": "Ergashgan qo'shma gap biri ikkinchisiga tobe bo'lgan qismlardan, ya'ni tobe qilinuvchi bosh gap va tobe ergash gapdan tuziladi."
    },
    {
        "subject": "majburiy_onatili",
        "block": "majburiy",
        "topic": "Sintaksis",
        "question": "Undalma qanday so'zlardan iborat bo'ladi?",
        "options": ["Nutq qaratilgan shaxs yoki narsani bildiruvchi", "Harakatni bildiruvchi", "Holatni bildiruvchi", "His-hayajonni bildiruvchi"],
        "answer": 0,
        "explanation": "Undalma so'zlovchining nutqi qaratilgan obyekt (shaxs, narsa yoki jonivor) nomini atovchi, e'tiborni tortuvchi so'zdir."
    },
    {
        "subject": "majburiy_onatili",
        "block": "majburiy",
        "topic": "Sintaksis",
        "question": "Kirish so'zlar gapda nima vazifani bajaradi?",
        "options": ["So'zlovchining ifodalanayotgan fikrga munosabatini bildiradi", "Gapning bosh bo'lagi vazifasida keladi", "Gaplarni bir-biriga bog'laydi", "Egani aniqlab keladi"],
        "answer": 0,
        "explanation": "Kirish so'zlar (masalan: ehtimol, chamasi, aftidan) aytilayotgan fikrga so'zlovchining tasdiq, shubha, gumon kabi munosabatlarini bildiradi."
    },
    {
        "subject": "majburiy_onatili",
        "block": "majburiy",
        "topic": "Sintaksis",
        "question": "Ko'chirma gap deganda nimani tushunasiz?",
        "options": ["O'zganing o'zgarishsiz berilgan nutqi", "So'zlovchining o'z so'zlari", "Faqat buyruq ma'nosidagi gap", "Mazmuni o'zgartirib berilgan o'zga nutqi"],
        "answer": 0,
        "explanation": "Boshqalarning yoki so'zlovchining avvalgi aytgan gapi hech bir o'zgarishsiz, aslicha keltirilishi ko'chirma gap deyiladi."
    },
    {
        "subject": "majburiy_onatili",
        "block": "majburiy",
        "topic": "Sintaksis",
        "question": "O'zlashma gap nima?",
        "options": ["O'zga nutqining faqat mazmuni saqlanib, shaklan o'zgartirib berilishi", "O'zganing o'zgarishsiz nutqi", "Faqat muallif gapi", "Tobe gapning bir turi"],
        "answer": 0,
        "explanation": "O'zga nutqining asliyatdagi shakli o'zgartirilib, faqat mazmunini saqlagan holda ifodalanishiga o'zlashma gap deyiladi."
    },
    {
        "subject": "majburiy_onatili",
        "block": "majburiy",
        "topic": "Sintaksis",
        "question": "Yig'iq gap nima?",
        "options": ["Faqat bosh bo'laklardan iborat bo'lgan gap", "Ikkinchi darajali bo'laklari mavjud gap", "Qo'shma gapning bir turi", "Egasi yashiringan gap"],
        "answer": 0,
        "explanation": "Tarkibida ikkinchi darajali bo'laklar (to'ldiruvchi, aniqlovchi, hol) qatnashmagan, faqat ega va kesimdan iborat gap yig'iq gapdir."
    },
    {
        "subject": "majburiy_onatili",
        "block": "majburiy",
        "topic": "Sintaksis",
        "question": "Yoyiq gap nima?",
        "options": ["Bosh bo'laklardan tashqari kamida bitta ikkinchi darajali bo'lak ishtirok etgan gap", "Faqat ega va kesimdan iborat gap", "Bir nechta gaplardan tuzilgan qo'shma gap", "Faqat kesim ishtirok etgan gap"],
        "answer": 0,
        "explanation": "Gap tarkibida ikkinchi darajali bo'lak qatnashsa, bunday gap yoyiq gap hisoblanadi."
    },
    {
        "subject": "majburiy_onatili",
        "block": "majburiy",
        "topic": "Sintaksis",
        "question": "Gap bo'laklarining odatdagi tartibi qanday?",
        "options": ["Ega boshida, kesim oxirida", "Kesim boshida, ega oxirida", "Ega doim kesimdan keyin keladi", "Istagan tartibda bo'lishi shart"],
        "answer": 0,
        "explanation": "O'zbek tilida grammatik qoidaga ko'ra gapda ega odatda boshida, kesim esa oxirida joylashadi."
    },
    {
        "subject": "majburiy_onatili",
        "block": "majburiy",
        "topic": "Sintaksis",
        "question": "Uyushiq bo'laklar gapning qaysi bo'laklari vazifasida kelishi mumkin?",
        "options": ["Gapning barcha bo'laklari", "Faqat ega", "Faqat kesim", "Faqat ikkinchi darajali bo'laklar"],
        "answer": 0,
        "explanation": "Bir xil so'roqqa javob bo'lib, bir xil sintaktik vazifani bajaruvchi so'zlar uyushiq bo'laklar bo'lib, u barcha gap bo'laklari doirasida kelishi mumkin."
    },
    {
        "subject": "majburiy_onatili",
        "block": "majburiy",
        "topic": "Imlo",
        "question": "Qaysi so'z imlo qoidalariga xato yozilgan?",
        "options": ["Tassaruf", "Tasavvur", "Tafakkur", "Taraddud"],
        "answer": 0,
        "explanation": "'Tassaruf' noto'g'ri, 'tasarruf' to'g'ri yozilishi kerak (birinchi s bitta, r ikkita)."
    },
    {
        "subject": "majburiy_onatili",
        "block": "majburiy",
        "topic": "Imlo",
        "question": "Qaysi so'z to'g'ri yozilgan?",
        "options": ["Mutolaa", "Mutolla", "Mutola", "Mutallaa"],
        "answer": 0,
        "explanation": "O'zbek tili imlo qoidalariga ko'ra 'mutolaa' (ikkita a bilan) to'g'ri hisoblanadi."
    },
    {
        "subject": "majburiy_onatili",
        "block": "majburiy",
        "topic": "Imlo",
        "question": "Bosh harflar imlosi bo'yicha qaysi qatorda xatolikka yo'l qo'yilgan?",
        "options": ["Ahmad farg'oniy", "Alisher Navoiy", "Sharof Rashidov", "Zahiriddin Muhammad Bobur"],
        "answer": 0,
        "explanation": "'Ahmad farg'oniy' emas, 'Ahmad Farg'oniy' deb bosh harflarda yozilishi kerak, chunki u tarixiy shaxs taxallusi/nisbasi."
    },
    {
        "subject": "majburiy_onatili",
        "block": "majburiy",
        "topic": "Imlo",
        "question": "Qo'shib yoziladigan so'zlar qatorini toping.",
        "options": ["Oqgul, suvilon", "Qip qizil, tez tez", "Yuz ming, besh yuz", "Asta sekin, kecha kunduz"],
        "answer": 0,
        "explanation": "Oqgul, suvilon kabi qo'shma so'zlar qoidaga ko'ra qo'shib yoziladi. Takroriy yoki juft so'zlar odatda chiziqcha bilan yoziladi."
    },
    {
        "subject": "majburiy_onatili",
        "block": "majburiy",
        "topic": "Imlo",
        "question": "Ajratib yoziladigan so'zlar qatorini toping.",
        "options": ["Temir yo'l, ochiq xat", "Kasalxona, ishchi", "Oqqush, shirinso'z", "Beshburchak, mingboshi"],
        "answer": 0,
        "explanation": "Temir yo'l, ochiq xat kabi birikmalar asosan so'z birikmasi hisoblanib, qismlari ajratib yoziladi."
    },
    {
        "subject": "majburiy_onatili",
        "block": "majburiy",
        "topic": "Imlo",
        "question": "Chiziqcha bilan yoziladigan so'zlar qatorini toping.",
        "options": ["Katta-kichik, ota-ona", "Toshkent shahri", "Oliy o'quv yurti", "Beshburchak"],
        "answer": 0,
        "explanation": "Juft so'zlar (katta-kichik, ota-ona) o'zbek tili imlosiga ko'ra o'rtasiga chiziqcha (defis) qo'yib yoziladi."
    },
    {
        "subject": "majburiy_onatili",
        "block": "majburiy",
        "topic": "Uslubiyot",
        "question": "Badiiy uslub nima?",
        "options": ["Obrazli va his-hayajonga boy bo'lgan til uslubi", "Ilmiy asarlar yoziladigan uslub", "Qonun va hujjatlar uslubi", "Kundalik so'zlashuv uslubi"],
        "answer": 0,
        "explanation": "Badiiy asarlar yoziladigan, ko'chma ma'noli so'zlar, obrazlilik va his-hayajon kuchli bo'lgan uslub badiiy uslub deyiladi."
    },
    {
        "subject": "majburiy_onatili",
        "block": "majburiy",
        "topic": "Uslubiyot",
        "question": "Ilmiy uslub qaysi asarlarda qo'llaniladi?",
        "options": ["Darslik, monografiya, ilmiy maqolalar", "She'rlar va dostonlar", "Qonunlar, farmonlar", "Kundalik so'zlashuv, suhbatlar"],
        "answer": 0,
        "explanation": "Ilmiy dalillar, atamalar va mantiqiylikka asoslangan ilmiy asarlar, darsliklar ilmiy uslubda yoziladi."
    },
    {
        "subject": "majburiy_onatili",
        "block": "majburiy",
        "topic": "Uslubiyot",
        "question": "Rasmiy-idoraviy uslubning o'ziga xosligi nimada?",
        "options": ["Hujjatlar, qonunlar, arizalar yozilishi tili", "Ko'chma ma'nodagi so'zlarning ko'pligi", "His-hayajonning yuqoriligi", "Atamalarning umuman yo'qligi"],
        "answer": 0,
        "explanation": "Davlat hujjatlari, qonunlar, arizalar, ma'lumotnomalar rasmiy-idoraviy uslubning ma'lum shakllangan qoliplari asosida yoziladi."
    },
    {
        "subject": "majburiy_onatili",
        "block": "majburiy",
        "topic": "Uslubiyot",
        "question": "Publitsistik uslub asosan qayerda qo'llaniladi?",
        "options": ["Gazeta va jurnallar, radio, televideniyeda", "Faqat badiiy adabiyotda", "Faqat qonun-qoidalarda", "Faqat xonadonlardagi suhbatlarda"],
        "answer": 0,
        "explanation": "Publitsistik (ommabop) uslub keng ommaga mo'ljallangan axborot vositalari, matbuot uslubidir."
    },
    {
        "subject": "majburiy_onatili",
        "block": "majburiy",
        "topic": "Fonetika",
        "question": "Sirg'aluvchi undoshlar to'g'ri berilgan qatorni toping.",
        "options": ["v, f, z, s, sh", "b, p, d, t", "m, n, ng", "ch, j, q, k"],
        "answer": 0,
        "explanation": "Talaffuz paytida havo oqimi tor oraliqdan ishqalanib o'tishidan hosil bo'ladigan undoshlar sirg'aluvchilar (v, f, z, s, sh, j, x, g', h) hisoblanadi."
    },
    {
        "subject": "majburiy_onatili",
        "block": "majburiy",
        "topic": "Fonetika",
        "question": "Portlovchi undoshlar qayta sanab o'tilgan qator qaysi?",
        "options": ["b, p, d, t, g, k, q", "s, z, sh, zh", "r, l, y", "h, x, ng"],
        "answer": 0,
        "explanation": "Portlovchi undoshlar to'siqqa urilib, uni yorib chiqish orqali hosil bo'ladi (b, p, d, t, g, k, q)."
    },
    {
        "subject": "majburiy_onatili",
        "block": "majburiy",
        "topic": "Fonetika",
        "question": "Sonor undoshlar qatorini ko'rsating.",
        "options": ["m, n, ng, l, r, y", "v, f, s, z", "b, d, g, j", "p, t, k, q"],
        "answer": 0,
        "explanation": "Ovozi shovqindan ustun turadigan jarangli undoshlar sonor (m, n, ng, l, r, y) undoshlar deb ataladi."
    }
]

file_path = r"C:\Users\T450\Downloads\FIKRA_v8\FIKRA_v8\src\data\new_questions\majburiy_onatili.json"
with open(file_path, "w", encoding="utf-8") as f:
    json.dump(questions, f, ensure_ascii=False, indent=4)

print(f"Successfully wrote {len(questions)} questions to {file_path}")
