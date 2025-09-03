// // Quick test script to debug the matching API
// const fetch = require('node-fetch');

// async function testMatchingAPI() {
//     try {
//         console.log('🧪 Testing matching API...');
        
//         // Test 1: Check if server is running
//         const healthResponse = await fetch('http://localhost:3000/api/health');
//         const healthData = await healthResponse.json();
//         console.log('✅ Server health:', healthData);
        
//         // Test 2: Get CVs from database
//         const cvsResponse = await fetch('http://localhost:3000/api/cvs');
//         const cvsData = await cvsResponse.json();
//         console.log(`📊 CVs in database: ${cvsData.data?.length || 0}`);
        
//         if (cvsData.data?.length > 0) {
//             console.log('📝 Sample CV:', {
//                 name: cvsData.data[0].name,
//                 specialty: cvsData.data[0].professional_specialty,
//                 skills: Object.keys(cvsData.data[0].skills || {})
//             });
//         }
        
//         // Test 3: Test matching endpoint
//         const matchResponse = await fetch('http://localhost:3000/api/match-candidates', {
//             method: 'POST',
//             headers: { 'Content-Type': 'application/json' },
//             body: JSON.stringify({
//                 requirements: 'JavaScript React developer with Node.js experience'
//             })
//         });
        
//         const matchData = await matchResponse.json();
//         console.log('🎯 Matching result:', {
//             success: matchData.success,
//             totalAnalyzed: matchData.totalAnalyzed,
//             matchCount: matchData.matches?.length || 0,
//             error: matchData.error
//         });
        
//         if (matchData.matches?.length > 0) {
//             console.log('🏆 Top match:', {
//                 name: matchData.matches[0].name,
//                 percentage: matchData.matches[0].percentage,
//                 reasoning: matchData.matches[0].reasoning
//             });
//         }
        
//     } catch (error) {
//         console.error('❌ Test failed:', error.message);
//     }
// }

// testMatchingAPI();
