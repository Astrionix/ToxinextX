import { supabase } from './config/supabase';

async function updateBucketPublic() {
    const { data, error } = await supabase.storage.updateBucket('posts', {
        public: true,
        fileSizeLimit: 5242880, // 5MB
        allowedMimeTypes: ['image/png', 'image/jpeg', 'image/jpg', 'image/gif']
    });

    if (error) {
        console.error('Error updating bucket:', error);
    } else {
        console.log('Bucket updated successfully:', data);
    }
}

updateBucketPublic();
