const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = 3000;

// CORS 설정
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(bodyParser.json());

// 메모리 데이터베이스
const users = new Map();

// 보석 데이터
const gemData = {
    1: { name: '작은 수정', emoji: '💎', chorus: 1, multiple: 1, lux: 0 },
    2: { name: '푸른 수정', emoji: '🔷', chorus: 2, multiple: 1, lux: 0 },
    3: { name: '붉은 수정', emoji: '🔶', chorus: 3, multiple: 1, lux: 0 },
    4: { name: '에메랄드', emoji: '💚', chorus: 4, multiple: 1, lux: 0 },
    5: { name: '사파이어', emoji: '💙', chorus: 5, multiple: 1, lux: 0 },
    6: { name: '루비', emoji: '❤️', chorus: 6, multiple: 1, lux: 0 },
    7: { name: '자수정', emoji: '💜', chorus: 7, multiple: 1.1, lux: 0 },
    8: { name: '황금석', emoji: '💛', chorus: 8, multiple: 1.2, lux: 0 },
    9: { name: '다이아몬드', emoji: '💍', chorus: 9, multiple: 1.3, lux: 0 },
    10: { name: '오팔', emoji: '🌈', chorus: 10, multiple: 1.4, lux: 0.5 },
    11: { name: '진주', emoji: '🤍', chorus: 11, multiple: 1.5, lux: 0.8 },
    12: { name: '토파즈', emoji: '🧡', chorus: 12, multiple: 1.6, lux: 1.0 },
    13: { name: '별의 조각', emoji: '⭐', chorus: 15, multiple: 2.0, lux: 2.5 },
    14: { name: '달의 눈물', emoji: '🌙', chorus: 20, multiple: 2.5, lux: 4.0 },
    15: { name: '태양의 심장', emoji: '☀️', chorus: 25, multiple: 3.0, lux: 5.0 }
};

// API 엔드포인트들

// 서버 상태 확인
app.get('/api/ping', (req, res) => {
    console.log('📡 Ping 요청 받음');
    res.json({ 
        success: true, 
        message: '서버가 정상 작동 중입니다',
        timestamp: new Date().toISOString()
    });
});

// 로그인
app.post('/api/auth/login', (req, res) => {
    try {
        let { userId } = req.body;
        console.log('🔐 로그인 요청:', userId);
        
        if (!userId || !users.has(userId)) {
            userId = uuidv4();
            users.set(userId, {
                points: 1000,
                prisms: 10,
                inventory: {},
                volumes: { multi: false, chorus: false, lux: false },
                equippedGems: []
            });
            console.log('👤 새 사용자 생성:', userId);
        }
        
        res.json({ success: true, userId });
    } catch (error) {
        console.error('❌ 로그인 오류:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// 게임 데이터 조회
app.get('/api/user/gamedata/:userId', (req, res) => {
    try {
        const { userId } = req.params;
        const userData = users.get(userId);
        
        if (!userData) {
            return res.status(404).json({ success: false, error: '사용자를 찾을 수 없습니다' });
        }
        
        res.json(userData);
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// 포인트 획득
app.post('/api/user/earn-points', (req, res) => {
    try {
        const { userId } = req.body;
        const userData = users.get(userId);
        
        if (!userData) {
            return res.status(404).json({ success: false, error: '사용자를 찾을 수 없습니다' });
        }
        
        const earnedPoints = Math.floor(Math.random() * 50) + 10;
        const luxChance = Math.random() < 0.1;
        
        userData.points += earnedPoints;
        let prismsEarned = 0;
        
        if (luxChance) {
            prismsEarned = 1;
            userData.prisms += 1;
        }
        
        res.json({
            success: true,
            earnedPoints,
            prismsEarned,
            newPoints: userData.points,
            newPrisms: userData.prisms
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// 뽑기
app.post('/api/gacha/draw', (req, res) => {
    try {
        const { userId, type, count = 1 } = req.body;
        const userData = users.get(userId);
        
        if (!userData) {
            return res.status(404).json({ success: false, error: '사용자를 찾을 수 없습니다' });
        }
        
        const costs = {
            beginner: { points: 10, prisms: 0 },
            normal: { points: 0, prisms: 5 },
            premium: { points: 0, prisms: 30 },
            luxury: { points: 0, prisms: 40 }
        };
        
        const cost = costs[type];
        const totalPointCost = cost.points * count;
        const totalPrismCost = cost.prisms * count;
        
        if (userData.points < totalPointCost || userData.prisms < totalPrismCost) {
            return res.status(400).json({ success: false, error: '재화가 부족합니다' });
        }
        
        userData.points -= totalPointCost;
        userData.prisms -= totalPrismCost;
        
        const results = [];
        for (let i = 0; i < count; i++) {
            const result = performSingleGacha(type);
            results.push(result);
            
            if (!userData.inventory[result.gemId]) {
                userData.inventory[result.gemId] = 0;
            }
            userData.inventory[result.gemId]++;
        }
        
        res.json({
            success: true,
            results,
            newPoints: userData.points,
            newPrisms: userData.prisms,
            newInventory: userData.inventory
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// 볼륨 구매
app.post('/api/user/buy-volume', (req, res) => {
    try {
        const { userId, type } = req.body;
        const userData = users.get(userId);
        
        if (!userData) {
            return res.status(404).json({ success: false, error: '사용자를 찾을 수 없습니다' });
        }
        
        if (userData.volumes[type]) {
            return res.status(400).json({ success: false, error: '이미 보유한 볼륨입니다' });
        }
        
        const volumePrices = {
            multi: { points: 100000, prisms: 0 },
            chorus: { points: 55000, prisms: 0 },
            lux: { points: 0, prisms: 100 }
        };
        
        const price = volumePrices[type];
        
        if (userData.points < price.points || userData.prisms < price.prisms) {
            return res.status(400).json({ success: false, error: '재화가 부족합니다' });
        }
        
        userData.points -= price.points;
        userData.prisms -= price.prisms;
        userData.volumes[type] = true;
        
        res.json({
            success: true,
            volumes: userData.volumes,
            points: userData.points,
            prisms: userData.prisms
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// 보석 장착/해제
app.post('/api/user/equip-gem', (req, res) => {
    try {
        const { userId, gemId, action } = req.body;
        const userData = users.get(userId);
        
        if (!userData) {
            return res.status(404).json({ success: false, error: '사용자를 찾을 수 없습니다' });
        }
        
        if (!userData.inventory[gemId] || userData.inventory[gemId] <= 0) {
            return res.status(400).json({ success: false, error: '보석을 보유하고 있지 않습니다' });
        }
        
        if (action === 'equip') {
            if (userData.equippedGems.length >= 1) {
                return res.status(400).json({ success: false, error: '장착 슬롯이 가득 찼습니다' });
            }
            userData.equippedGems.push(parseInt(gemId));
        } else if (action === 'unequip') {
            const index = userData.equippedGems.indexOf(parseInt(gemId));
            if (index === -1) {
                return res.status(400).json({ success: false, error: '장착되지 않은 보석입니다' });
            }
            userData.equippedGems.splice(index, 1);
        }
        
        res.json({
            success: true,
            equippedGems: userData.equippedGems
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// 보석 추출
app.post('/api/user/extract-gem', (req, res) => {
    try {
        const { userId, gemId } = req.body;
        const userData = users.get(userId);
        
        if (!userData) {
            return res.status(404).json({ success: false, error: '사용자를 찾을 수 없습니다' });
        }
        
        if (!userData.inventory[gemId] || userData.inventory[gemId] <= 0) {
            return res.status(400).json({ success: false, error: '보석을 보유하고 있지 않습니다' });
        }
        
        let prismReward = 1;
        if (gemId >= 13) prismReward = 10;
        else if (gemId >= 10) prismReward = 5;
        else if (gemId >= 7) prismReward = 3;
        else if (gemId >= 4) prismReward = 2;
        
        userData.inventory[gemId]--;
        if (userData.inventory[gemId] === 0) {
            delete userData.inventory[gemId];
        }
        userData.prisms += prismReward;
        
        res.json({
            success: true,
            prismReward,
            newPrisms: userData.prisms,
            newInventory: userData.inventory
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// 뽑기 로직
function performSingleGacha(type) {
    const probabilities = {
        beginner: { common: 70, rare: 25, epic: 4, legendary: 1, unique: 0 },
        normal: { common: 50, rare: 35, epic: 12, legendary: 2.8, unique: 0.2 },
        premium: { common: 30, rare: 40, epic: 20, legendary: 8, unique: 2 },
        luxury: { common: 20, rare: 30, epic: 25, legendary: 20, unique: 5 }
    };
    
    const gemsByGrade = {
        common: [1, 2, 3],
        rare: [4, 5, 6],
        epic: [7, 8, 9],
        legendary: [10, 11, 12],
        unique: [13, 14, 15]
    };
    
    const gradeNames = {
        common: '일반',
        rare: '희귀',
        epic: '에픽',
        legendary: '전설',
        unique: '유니크'
    };
    
    const prob = probabilities[type];
    const rand = Math.random() * 100;
    
    let grade;
    if (rand < prob.unique) grade = 'unique';
    else if (rand < prob.unique + prob.legendary) grade = 'legendary';
    else if (rand < prob.unique + prob.legendary + prob.epic) grade = 'epic';
    else if (rand < prob.unique + prob.legendary + prob.epic + prob.rare) grade = 'rare';
    else grade = 'common';
    
    const availableGems = gemsByGrade[grade];
    const gemId = availableGems[Math.floor(Math.random() * availableGems.length)];
    
    return {
        gemId,
        grade: gradeNames[grade]
    };
}

// 서버 시작
app.listen(PORT, () => {
    console.log('🚀=================================🚀');
    console.log(`   보석 뽑기 게임 서버 시작!`);
    console.log(`🌐 서버 주소: http://localhost:${PORT}`);
    console.log(`📡 API 엔드포인트: http://localhost:${PORT}/api`);
    console.log('🚀=================================🚀');
    console.log('🎮 게임을 시작하려면 브라우저에서 index.html을 열어주세요!');
});