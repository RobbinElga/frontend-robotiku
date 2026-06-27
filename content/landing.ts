export type IconName =
    | "bot" | "cpu" | "code" | "check" | "trophy" | "star" | "puzzle" | "users";

export type ProgramCard = {
    id: string;
    icon: IconName;
    age: string;
    title: string;
    desc: string;
    points: string[];
    featured?: boolean;
};

export type Achievement = { id: string; icon: IconName; title: string; desc: string };

export const landingContent = {
    about: {
        badge: "Mengenal RobotiKU",
        title: "Bermain Sambil Mengasah Logika Masa Depan",
        paragraphs: [
            "Di RobotiKU, kami percaya anak belajar paling efektif saat sedang bersenang-senang. Kurikulum kami mengubah konsep coding dan elektronika yang rumit menjadi permainan menyusun balok yang seru.",
            "Dengan metode hands-on learning, anak tidak hanya menghafal teori, tetapi membangun kreasi mereka sendiri dari nol — memupuk rasa percaya diri dan ketangguhan mental.",
        ],
        highlights: [
            { icon: "puzzle" as IconName, title: "Hands-on", desc: "Praktek langsung" },
            { icon: "users" as IconName, title: "Kolaboratif", desc: "Kerja sama tim" },
        ],
    },
    programs: [
        {
            id: "robo-kids",
            icon: "bot",
            age: "Usia 5-7 Tahun",
            title: "Robo Kids",
            desc: "Pengenalan dasar robotika menggunakan balok susun warna-warni tanpa layar (screen-free coding).",
            points: ["Motorik halus", "Pengenalan pola"],
        },
        {
            id: "iot-junior",
            icon: "cpu",
            age: "Usia 8-10 Tahun",
            title: "IoT Junior",
            desc: "Belajar merakit komponen elektronik sederhana dan memprogram mikrokontroler dasar.",
            points: ["Rangkaian listrik", "Block-based coding"],
            featured: true,
        },
        {
            id: "pro-coder",
            icon: "code",
            age: "Usia 11-15 Tahun",
            title: "Pro Coder",
            desc: "Pemrograman teks berbasis Python dan C++ untuk membangun proyek robotika yang kompleks.",
            points: ["Text-based coding", "Logika algoritma"],
        },
    ] as ProgramCard[],
    achievements: {
        title: "Kompetisi dan Penghargaan",
        desc: "Siswa kami rutin berpartisipasi dan meraih prestasi di berbagai kompetisi robotik tingkat nasional maupun internasional — bukti kualitas pembelajaran di RobotiKU.",
        items: [
            {
                id: " orn-2023",
                icon: "trophy",
                title: "Olimpiade Robotik Nasional",
                desc: "Juara 1 kategori Maze Solving Junior 2023. Bukti ketangkasan logika siswa kami.",
            },
            {
                id: "techkids",
                icon: "star",
                title: "TechKids Expo Innovation",
                desc: "Penghargaan inovasi terbaik untuk proyek Smart Trash Bin berbasis IoT.",
            },
        ] as Achievement[],
    },

    // ===== tambahkan di dalam landingContent =====
    testimonials: {
        title: "Apa Kata Mereka",
        desc: "Pengalaman orang tua dan siswa yang telah bergabung bersama kami.",
        items: [
            {
                id: "t1", name: "Ibu Budi", role: "Orang tua siswa Robo Kids", initials: "IB", rating: 5,
                text: "Anak saya jadi lebih kreatif dan selalu tidak sabar menunggu kelas robotik setiap minggunya. Mentornya sangat sabar!"
            },
            {
                id: "t2", name: "Pak Andi", role: "Orang tua siswa Pro Coder", initials: "PA", rating: 5,
                text: "Kurikulumnya terstruktur dengan baik. Sekarang anak saya sudah bisa bikin game sederhana sendiri. Sangat recommended!"
            },
            {
                id: "t3", name: "Ibu Siti", role: "Orang tua siswa IoT Junior", initials: "IS", rating: 4.5,
                text: "Fasilitasnya lengkap dan alat peraganya aman untuk anak-anak. Metode belajarnya benar-benar hands-on."
            },
        ] as Testimonial[],
    },

    gallery: {
        title: "Keseruan di Kelas",
        desc: "Intip keseruan anak-anak saat merakit dan memprogram robot pertama mereka.",
        mainCaption: "Kerja Sama Tim",
        ideaTile: "Ide Kreatif",
        competitionTile: { title: "Kompetisi Tahunan", desc: "Wadah unjuk gigi hasil karya siswa." },
    },

    // Sementara statis. Nanti diganti fetch GET /api/v1/articles?status=publish&limit=3
    articles: {
        title: "Artikel & Tips",
        desc: "Wawasan seputar robotika, parenting, dan teknologi untuk anak.",
        items: [
            { id: 1, slug: "kenapa-anak-perlu-belajar-coding", title: "Kenapa Anak Perlu Belajar Coding Sejak Dini?", category: "Tips Belajar", excerpt: "Coding melatih logika, ketekunan, dan kreativitas — keterampilan inti abad 21.", cover: "/images/artikel-1.jpg", date: "12 Jun 2026" },
            { id: 2, slug: "5-proyek-robotik-seru-di-rumah", title: "5 Proyek Robotik Seru yang Bisa Dicoba di Rumah", category: "Aktivitas", excerpt: "Eksperimen sederhana untuk mengisi akhir pekan bersama si kecil.", cover: "/images/artikel-2.jpg", date: "5 Jun 2026" },
            { id: 3, slug: "screen-free-coding-untuk-balita", title: "Screen-Free Coding: Belajar Logika Tanpa Layar", category: "Parenting", excerpt: "Cara mengenalkan konsep pemrograman pada balita tanpa gadget.", cover: "/images/artikel-3.jpg", date: "29 Mei 2026" },
        ] as ArticleCard[],
    },

    cta: {
        title: "Siap Memulai Petualangan?",
        desc: "Pilih jalur yang sesuai untuk Anda atau sekolah Anda.",
        partner: { title: "Bergabung Menjadi Mitra", desc: "Bawa ekstrakurikuler robotik paling modern dan diminati ke sekolah Anda." },
        trial: { title: "Daftar Free Trial", desc: "Rasakan langsung keseruan merakit robot pertamamu secara gratis!" },
        admins: [
            { label: "Admin Jabodetabek", phone: "6281234567890" },
            { label: "Admin Pontianak", phone: "6281234567891" },
        ],
    },

    contact: {
        tagline: "Membangun generasi masa depan melalui pendidikan robotika yang kreatif dan menyenangkan.",
        address: "Jl. Robotika No. 123, Jakarta Selatan",
        phone: "+62 812 3456 7890",
        email: "halo@robotiku.id",
        whatsapp: "6281234567890",
    },
};

export type Testimonial = {
    id: string; name: string; role: string; initials: string; rating: number; text: string;
};

export type ArticleCard = {
    id: number; slug: string; title: string; category: string; excerpt: string; cover: string; date: string;
};