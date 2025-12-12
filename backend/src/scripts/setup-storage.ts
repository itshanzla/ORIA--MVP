import { supabase } from '../config/supabase.js';

async function setupStorage() {
    console.log('Setting up Supabase Storage bucket...');

    // Check if bucket exists
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();

    if (listError) {
        console.error('Error listing buckets:', listError);
        return;
    }

    const bucketExists = buckets?.some(b => b.name === 'oria-assets');

    if (bucketExists) {
        console.log('Bucket "oria-assets" already exists');
    } else {
        // Create bucket
        const { data, error } = await supabase.storage.createBucket('oria-assets', {
            public: true,
            fileSizeLimit: 52428800, // 50MB
            allowedMimeTypes: [
                'audio/mpeg',
                'audio/mp3',
                'audio/wav',
                'audio/wave',
                'audio/x-wav',
                'audio/aac',
                'audio/ogg',
                'audio/flac',
                'audio/x-m4a',
                'audio/mp4',
                'image/jpeg',
                'image/jpg',
                'image/png',
                'image/gif',
                'image/webp'
            ]
        });

        if (error) {
            console.error('Error creating bucket:', error);
        } else {
            console.log('Bucket "oria-assets" created successfully:', data);
        }
    }

    console.log('Storage setup complete!');
}

setupStorage().catch(console.error);
