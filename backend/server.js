        
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
