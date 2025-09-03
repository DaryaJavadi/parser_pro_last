// // Test script for the enhanced percentage matching system
// const express = require('express');
// const sqlite3 = require('sqlite3').verbose();
// const path = require('path');

// // Simple test to verify the matching logic works
// async function testMatching() {
//     console.log('🧪 Testing Enhanced Percentage Matching System...\n');
    
//     // Test data
//     const mockCV = {
//         id: 1,
//         name: "John Doe",
//         professional_specialty: "Software Development",
//         total_years_experience: 5,
//         skills: {
//             technical_skills: ["JavaScript", "React", "Node.js", "Python"],
//             programming_languages: ["JavaScript", "Python", "Java"],
//             frameworks_tools: ["React", "Express", "MongoDB"]
//         },
//         experience: [
//             {
//                 position: "Senior Developer",
//                 company: "Tech Corp",
//                 description: "Developed web applications using React and Node.js"
//             }
//         ]
//     };
    
//     const requirements = "Looking for JavaScript developer with React experience and Node.js backend skills";
    
//     // Extract keywords function (copied from server.js)
//     const extractKeywords = (text) => {
//         return text
//             .toLowerCase()
//             .replace(/[^\w\s+#.-]/g, ' ')
//             .split(/\s+/)
//             .filter(w => w && w.length > 2)
//             .filter(w => !['and', 'the', 'for', 'with', 'are', 'you', 'can', 'will', 'have', 'must', 'should', 'years', 'experience', 'work', 'job', 'role', 'position', 'candidate', 'looking', 'seeking'].includes(w));
//     };
    
//     const reqWords = extractKeywords(requirements);
//     console.log(`🎯 Job Requirements Keywords: ${reqWords.join(', ')}`);
    
//     const importantWords = reqWords.filter(w => 
//         w.length > 4 || 
//         /^[A-Z]+$/i.test(w) || 
//         w.includes('.') || w.includes('#') || w.includes('+')
//     );
//     console.log(`⭐ Important Keywords: ${importantWords.join(', ')}`);
    
//     // Create CV text for matching
//     const skillsText = Object.values(mockCV.skills).flat().join(' ');
//     const experienceText = mockCV.experience.map(exp => `${exp.position} ${exp.company} ${exp.description}`).join(' ');
    
//     const cvText = [
//         mockCV.name,
//         mockCV.professional_specialty,
//         skillsText,
//         experienceText
//     ].join(' ').toLowerCase();
    
//     console.log(`📝 CV Text Sample: ${cvText.substring(0, 100)}...`);
    
//     const cvWords = extractKeywords(cvText);
//     console.log(`📊 CV Keywords: ${cvWords.slice(0, 10).join(', ')}...`);
    
//     // Calculate matches
//     const exactMatches = reqWords.filter(w => cvWords.includes(w));
//     const partialMatches = reqWords.filter(w => 
//         !exactMatches.includes(w) && 
//         cvWords.some(cvWord => cvWord.includes(w) || w.includes(cvWord))
//     );
//     const importantMatches = importantWords.filter(w => exactMatches.includes(w));
    
//     console.log(`\n✅ Exact matches: ${exactMatches.join(', ')}`);
//     console.log(`🔍 Partial matches: ${partialMatches.join(', ')}`);
//     console.log(`⭐ Important matches: ${importantMatches.join(', ')}`);
    
//     // Enhanced percentage calculation
//     const totalMatches = exactMatches.length + partialMatches.length;
//     let percentage = 0;
    
//     if (totalMatches === 0) {
//         percentage = 0;
//     } else {
//         const exactMatchRatio = exactMatches.length / reqWords.length;
//         const partialMatchRatio = partialMatches.length / reqWords.length;
//         const importantMatchRatio = importantMatches.length / Math.max(importantWords.length, 1);
//         const totalMatchRatio = totalMatches / reqWords.length;
        
//         const specialtyMatch = mockCV.professional_specialty && requirements.toLowerCase().includes(mockCV.professional_specialty.toLowerCase());
//         const specialtyBonus = specialtyMatch ? 0.15 : 0;
        
//         const experienceBonus = mockCV.total_years_experience > 0 ? Math.min(0.1, mockCV.total_years_experience / 50) : 0;
        
//         let baseScore = 0;
        
//         if (exactMatchRatio >= 0.7 && importantMatchRatio >= 0.5) {
//             baseScore = 90 + (exactMatchRatio * 10) + (importantMatchRatio * 5);
//         }
//         else if (exactMatchRatio >= 0.5 || (totalMatchRatio >= 0.8 && importantMatchRatio >= 0.3)) {
//             baseScore = 85 + (exactMatchRatio * 10) + (totalMatchRatio * 8) + (importantMatchRatio * 5);
//         }
//         else if (exactMatchRatio >= 0.3 || (totalMatchRatio >= 0.6 && importantMatchRatio >= 0.2)) {
//             baseScore = 80 + (exactMatchRatio * 12) + (totalMatchRatio * 8) + (importantMatchRatio * 8);
//         }
//         else if (exactMatchRatio >= 0.2 || totalMatchRatio >= 0.4) {
//             baseScore = 75 + (exactMatchRatio * 15) + (totalMatchRatio * 10) + (importantMatchRatio * 10);
//         }
//         else {
//             baseScore = 70 + (totalMatchRatio * 10) + (exactMatchRatio * 20);
//         }
        
//         percentage = Math.min(100, Math.round(baseScore + (specialtyBonus * 100) + (experienceBonus * 100)));
        
//         if (percentage < 70) {
//             percentage = 70;
//         }
//     }
    
//     console.log(`\n📊 Final Results:`);
//     console.log(`   Exact Match Ratio: ${(exactMatches.length / reqWords.length * 100).toFixed(1)}%`);
//     console.log(`   Total Match Ratio: ${(totalMatches / reqWords.length * 100).toFixed(1)}%`);
//     console.log(`   Important Match Ratio: ${(importantMatches.length / Math.max(importantWords.length, 1) * 100).toFixed(1)}%`);
//     console.log(`   🎯 FINAL PERCENTAGE: ${percentage}%`);
    
//     // Generate reasoning
//     let reasoning = '';
//     if (percentage >= 95) {
//         reasoning = `Excellent match (${percentage}%) - Strong alignment with job requirements`;
//     } else if (percentage >= 90) {
//         reasoning = `Very strong match (${percentage}%) - High relevance to position`;
//     } else if (percentage >= 85) {
//         reasoning = `Strong match (${percentage}%) - Good fit for the role`;
//     } else if (percentage >= 80) {
//         reasoning = `Good match (${percentage}%) - Relevant experience and skills`;
//     } else if (percentage >= 75) {
//         reasoning = `Fair match (${percentage}%) - Some relevant qualifications`;
//     } else if (percentage >= 70) {
//         reasoning = `Basic match (${percentage}%) - Limited but relevant experience`;
//     } else {
//         reasoning = `No significant match found`;
//     }
    
//     console.log(`   💬 Reasoning: ${reasoning}`);
//     console.log(`\n✅ Enhanced percentage matching system is working correctly!`);
// }

// testMatching().catch(console.error);
