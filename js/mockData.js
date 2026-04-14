// mockData.js - Initial prototype data

const MOCK_DATA = {
    clients: [
        { id: 'c1', name: 'Brothers Filmes', avatar: 'https://images.unsplash.com/photo-1594909122845-11baa439b7bf?q=80&w=2070&auto=format&fit=crop' },
        { id: 'c2', name: 'Designers Papelée', avatar: 'https://images.unsplash.com/photo-1628155930542-3c7a64e2c833?q=80&w=1974&auto=format&fit=crop' },
        { id: 'c3', name: 'Asfer Química', avatar: 'https://images.unsplash.com/photo-1579373903781-fd5c0c30c4cd?q=80&w=1974&auto=format&fit=crop' }
    ],
    posts: [
        {
            id: 'p1',
            clientId: 'c1',
            type: 'carousel',
            status: 'pending', // pending, approved, rejected
            date: '2026-04-15',
            username: 'brothersfilmes',
            userAvatar: 'https://images.unsplash.com/photo-1594909122845-11baa439b7bf?q=80&w=2070&auto=format&fit=crop',
            media: [
                'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?q=80&w=1000&auto=format&fit=crop', // Wedding couple
                'https://images.unsplash.com/photo-1519225421980-715cb0215aed?q=80&w=1000&auto=format&fit=crop', // Detail
                'https://images.unsplash.com/photo-1606800052052-a08af7148866?q=80&w=1000&auto=format&fit=crop'  // Cinematic
            ],
            likes: 124,
            caption: 'Aquela luz de final de tarde que transforma o filme do seu casamento em uma obra de arte. ✨🎬\n\nQual cena você mais amou desse dia? 1, 2 ou 3? 👇\n\n#BrothersFilmes #WeddingFilm #CinemaDeCasamento',
            ctaText: 'Ver Portfólio',
            comments: [
                { author: 'Revisora Maria', text: 'Gostei do carrossel, mas achei a foto 2 um pouco escura. Podemos clarear?', date: '10/04/2026', type: 'internal' }
            ]
        },
        {
            id: 'p2',
            clientId: 'c1',
            type: 'reels',
            status: 'approved',
            date: '2026-04-18',
            username: 'brothersfilmes',
            userAvatar: 'https://images.unsplash.com/photo-1594909122845-11baa439b7bf?q=80&w=2070&auto=format&fit=crop',
            media: [
                'https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80&w=1000&auto=format&fit=crop' // Reels poster
            ],
            likes: 589,
            caption: 'Bastidores de uma captação em 4K. É assim que nós fazemos a mágica acontecer! 🎥🔥',
            ctaText: '',
            comments: []
        },
        {
            id: 'p3',
            clientId: 'c2',
            type: 'image',
            status: 'pending',
            date: '2026-04-20',
            username: 'designerspapelee',
            userAvatar: 'https://images.unsplash.com/photo-1628155930542-3c7a64e2c833?q=80&w=1974&auto=format&fit=crop',
            media: [
                'https://images.unsplash.com/photo-1512403754473-27825d481ee6?q=80&w=1000&auto=format&fit=crop' 
            ],
            likes: 45,
            caption: 'Nova identidade visual para nossa linha de convites premium. Papel com textura especial 300g. 💌',
            ctaText: 'Comprar agora',
            comments: [
                { author: 'Cliente (João)', text: 'A cor não ficou parecida com a que enviei. O rosa deve ser mais pastel.', date: '12/04/2026', type: 'client' }
            ]
        }
    ]
};
