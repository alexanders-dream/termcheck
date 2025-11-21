import { chunkText, getChunkSize } from '../src/lib/chunking';

function testChunking() {
    console.log('Starting chunking verification...');

    // Test 1: Small document
    const smallDoc = 'This is a small document. It should be one chunk.';
    const smallSize = getChunkSize(smallDoc.length);
    console.log(`\nTest 1: Small Doc (Length: ${smallDoc.length})`);
    console.log(`Expected Size: 5000, Actual: ${smallSize}`);
    if (smallSize !== 5000) console.error('FAIL: Small doc size incorrect');

    // Test 2: Large document
    const largeDoc = 'a'.repeat(100001);
    const largeSize = getChunkSize(largeDoc.length);
    console.log(`\nTest 2: Large Doc (Length: ${largeDoc.length})`);
    console.log(`Expected Size: 10000, Actual: ${largeSize}`);
    if (largeSize !== 10000) console.error('FAIL: Large doc size incorrect');

    // Test 3: Sentence splitting
    const sentenceText = 'First sentence. Second sentence. Third sentence.';
    // Force small chunk size to trigger split
    const sentenceChunks = chunkText(sentenceText, 20, 0);
    console.log(`\nTest 3: Sentence Splitting`);
    console.log('Chunks:', sentenceChunks);
    if (sentenceChunks.length > 1 && sentenceChunks[0].endsWith('.')) {
        console.log('PASS: Split at sentence boundary');
    } else {
        console.log('FAIL: Did not split at sentence boundary correctly');
    }

    // Test 4: Paragraph splitting
    const paraText = 'Para 1 content.\n\nPara 2 content.\n\nPara 3 content.';
    const paraChunks = chunkText(paraText, 20, 0);
    console.log(`\nTest 4: Paragraph Splitting`);
    console.log('Chunks:', paraChunks);
    if (paraChunks.length > 1 && paraChunks[0].includes('\n\n')) {
        console.log('PASS: Split at paragraph boundary');
    } else {
        console.log('FAIL: Did not split at paragraph boundary correctly');
    }

    // Test 5: Word splitting
    const wordText = 'Word1 Word2 Word3 Word4';
    const wordChunks = chunkText(wordText, 10, 0);
    console.log(`\nTest 5: Word Splitting`);
    console.log('Chunks:', wordChunks);
    if (wordChunks[0] === 'Word1 ' || wordChunks[0] === 'Word1') { // Depending on if space is included
        console.log('PASS: Split at word boundary');
    } else {
        console.log('FAIL: Did not split at word boundary');
    }

    console.log('\nVerification complete.');
}

testChunking();
