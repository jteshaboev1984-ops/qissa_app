from pathlib import Path

path = Path('supabase/functions/story-generate/storySixMinuteEditorial.ts')
text = path.read_text()

def replace_once(old: str, new: str):
    global text
    count = text.count(old)
    if count != 1:
        raise SystemExit(f'expected exactly one match, got {count}: {old[:180]!r}')
    text = text.replace(old, new, 1)

replace_once(
    "Puf ikkala fikrni ham tasavvur qilib ko‘rdi. Avval quloqlarini tik tutdi, keyin birini bukdi. Yorug‘qo‘ng‘izlar ham go‘yo tanlayotgandek bir bargga, bir yong‘oq po‘chog‘iga uchib qo‘nardi. Lola ularning bu jiddiy ishiga qarab kulmaslikka harakat qildi.",
    "Puf avval barglardan kichkina quyon yuzini yasab ko‘rdi. Bir quloq juda uzun, ikkinchisi juda kalta chiqdi. Lola uni ko‘rib, bu quyon emas, sabziga o‘xshaydi, dedi. Puf rasmni aylantirib ko‘rdi. Shunda u rostdan ham sabziga o‘xshab qoldi. Hamma yana kuldi. So‘ng Nura yong‘oq po‘choqlarini bir-biriga sekin urib ko‘rdi. Ovozi baland emas, yoqimli edi.\n\nPuf ikkala fikrni ham tasavvur qilib ko‘rdi. Avval quloqlarini tik tutdi, keyin birini bukdi. Yorug‘qo‘ng‘izlar ham go‘yo tanlayotgandek bir bargga, bir yong‘oq po‘chog‘iga uchib qo‘nardi. Lola ularning bu jiddiy ishiga qarab kulmaslikka harakat qildi.",
)

replace_once(
    "Aka rasmni in ichidagi past devorga ilib qo‘ydi. Yorug‘qo‘ng‘izlardan biri kirib, rasm yonida bir marta yonib-o‘chdi. Puf buni “yulduz ham ishlayapti” deb tushuntirdi.",
    "Aka rasmni in ichidagi past devorga ilib qo‘ydi. Yorug‘qo‘ng‘izlardan biri kirib, rasm yonida bir marta yonib-o‘chdi. Puf buni “yulduz ham ishlayapti” deb tushuntirdi.\n\nPuf akasiga rasmdagi har bir narsani ko‘rsatib chiqdi. Dumaloq barg oy edi. Ikki uzun barg quloq edi. Eng kichik barg esa yulduz edi. Aka yulduzni Pufning burniga o‘xshatdi. Puf bunga rozi bo‘lmadi va burnini ko‘rsatib, uning ancha chiroyli ekanini aytdi. Lola darrov Pufning burniga qarab tekshirgandek bo‘ldi. Toti esa juda jiddiy bosh irg‘adi. Bu gap yana hammani kuldirdi.",
)

replace_once(
    "Aka jim turib eshitdi. Keyin u ham ikki marta kaftini sekin urdi.\n\n— Yana bir marta bo‘ladimi?",
    "Aka jim turib eshitdi. Keyin u ham ikki marta kaftini sekin urdi.\n\nAka qo‘shiq tugagach, Pufdan yana qanday ovozlar borligini so‘radi. Lola yong‘oq po‘chog‘ini kaftida aylantirdi. Toti quruq bargga bitta panjasini qo‘ydi. Puf esa quloqlarini navbat bilan ko‘tarib, o‘zini boshliqdek ko‘rsatdi. O‘ng qulog‘i ko‘tarilsa hamma chalardi, chap qulog‘i ko‘tarilsa hamma jim turardi. Bir safar ikkala qulog‘i birga ko‘tarilib, Pufning o‘zi nima qilishni bilmay qoldi. Hamma kuldi.\n\n— Yana bir marta bo‘ladimi?",
)

path.write_text(text)
