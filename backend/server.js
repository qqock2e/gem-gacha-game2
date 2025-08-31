const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// 미들웨어 설정
app.use(cors());
app.use(express.json());

// 게임 데이터
let users = [];
let nextUserId = 1;

// 보석 종류와 확률
const gems = [
    { name: '다이아몬드', rarity: 'legendary', probability: 0.01, color: '#b9f2ff' },
    { name: '루비', rarity: 'epic', probability: 0.05, color: '#ff6b6b' },
    { name: '사파이어', rarity: 'epic', probability: 0.05, color: '#4ecdc4' },
    { name: '에메랄드', rarity: 'rare', probability: 0.15, color: '#45b7d1' },
    { name: '자수정', rarity: 'rare', probability: 0.15, color: '#96ceb4' },
    { name: '토파즈', rarity: 'common', probability: 0.30, color: '#ffeaa7' },
    { name: '석영', rarity: 'common', probability: 0.29, color: '#ddd' }
];

// 루트 경로 - 서버 정보
app.get('/', (req, res) => {
    res.json({
        message: '🎮 보석 뽑기 게임 서버',
        status: 'running',
        endpoints: [
            'GET / - 서버 정보',
            'GET /api/ping - 서버 상태 확인',
            'GET /api/users - 모든 사용자 조회',
            'POST /api/users - 새 사용자 생성',
            'POST /api/gacha - 보석 뽑기',
            'GET /api/gems - 보석 정보 조회'
        ],
        timestamp: new Date().toISOString()
    });
});

// 서버 상태 확인
app.get('/api/ping', (req, res) => {
    res.json({
        success: true,
        message: '🚀 서버가 정상 작동 중입니다!',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});

// 모든 사용자 조회
app.get('/api/users', (req, res) => {
    res.json({
        success: true,
        users: users,
        count: users.length
    });
});

// 새 사용자 생성
app.post('/api/users', (req, res) => {
    const { username } = req.body;
    
    if (!username || username.trim() === '') {
        return res.status(400).json({
            success: false,
            message: '사용자명을 입력해주세요'
        });
    }

    // 중복 사용자명 체크
    const existingUser = users.find(user => user.username === username.trim());
    if (existingUser) {
        return res.status(400).json({
            success: false,
            message: '이미 존재하는 사용자명입니다'
        });
    }

    const newUser = {
        id: nextUserId++,
        username: username.trim(),
        gems: [],
        totalGachas: 0,
        createdAt: new Date().toISOString()
    };

    users.push(newUser);

    res.json({
        success: true,
        message: '사용자가 생성되었습니다',
        user: newUser
    });
});

// 보석 뽑기
app.post('/api/gacha', (req, res) => {
    const { userId } = req.body;

    if (!userId) {
        return res.status(400).json({
            success: false,
            message: '사용자 ID가 필요합니다'
        });
    }

    const user = users.find(u => u.id === userId);
    if (!user) {
        return res.status(404).json({
            success: false,
            message: '사용자를 찾을 수 없습니다'
        });
    }

    // 랜덤 보석 선택
    const random = Math.random();
    let cumulativeProbability = 0;
    let selectedGem = null;

    for (const gem of gems) {
        cumulativeProbability += gem.probability;
        if (random <= cumulativeProbability) {
            selectedGem = { ...gem };
            break;
        }
    }

    // 혹시 선택되지 않았다면 마지막 보석 선택
    if (!selectedGem) {
        selectedGem = { ...gems[gems.length - 1] };
    }

    // 고유 ID 추가
    selectedGem.id = Date.now() + Math.random();
    selectedGem.obtainedAt = new Date().toISOString();

    // 사용자에게 보석 추가
    user.gems.push(selectedGem);
    user.totalGachas++;

    res.json({
        success: true,
        message: `${selectedGem.name}을(를) 획득했습니다!`,
        gem: selectedGem,
        user: {
            id: user.id,
            username: user.username,
            totalGems: user.gems.length,
            totalGachas: user.totalGachas
        }
    });
});

// 보석 정보 조회
app.get('/api/gems', (req, res) => {
    res.json({
        success: true,
        gems: gems,
        message: '사용 가능한 보석 목록'
    });
});

// 특정 사용자 조회
app.get('/api/users/:id', (req, res) => {
    const userId = parseInt(req.params.id);
    const user = users.find(u => u.id === userId);

    if (!user) {
        return res.status(404).json({
            success: false,
            message: '사용자를 찾을 수 없습니다'
        });
    }

    res.json({
        success: true,
        user: user
    });
});

// 404 에러 처리
app.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        message: '요청한 경로를 찾을 수 없습니다',
        path: req.originalUrl,
        availableEndpoints: [
            'GET /',
            'GET /api/ping',
            'GET /api/users',
            'POST /api/users',
            'POST /api/gacha',
            'GET /api/gems'
        ]
    });
});

// 서버 시작
app.listen(PORT, () => {
    console.log('🚀 보석 뽑기 게임 서버 시작!');
    console.log(`🌐 서버 주소: http://localhost:${PORT}`);
    console.log(`📊 API 문서: http://localhost:${PORT}/`);
    console.log('⏰ 시작 시간:', new Date().toLocaleString());
});

// 프로세스 종료 처리
process.on('SIGTERM', () => {
    console.log('🛑 서버 종료 중...');
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('🛑 서버 종료 중...');
    process.exit(0);
});
