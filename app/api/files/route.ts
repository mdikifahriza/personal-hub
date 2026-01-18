import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// GET - List files atau list buckets
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const action = searchParams.get('action');
    const bucket = searchParams.get('bucket');

    // List all buckets
    if (action === 'list-buckets') {
      const { data: buckets, error } = await supabase.storage.listBuckets();
      
      if (error) throw error;

      return NextResponse.json({ 
        buckets: buckets.map(b => ({ 
          id: b.id, 
          name: b.name,
          created_at: b.created_at 
        })) 
      });
    }

    // List files in bucket
    if (bucket) {
      const { data: files, error } = await supabase
        .from('files')
        .select('*')
        .eq('bucket_id', bucket)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return NextResponse.json({ files: files || [] });
    }

    return NextResponse.json({ files: [] });
  } catch (error) {
    console.error('GET Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch data' },
      { status: 500 }
    );
  }
}

// POST - Upload file atau create bucket
export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get('content-type');

    // Create bucket
    if (contentType?.includes('application/json')) {
      const body = await req.json();
      
      if (body.action === 'create-bucket') {
        const { data, error } = await supabase.storage.createBucket(body.name, {
          public: true,
          fileSizeLimit: 10485760, // 10MB
        });

        if (error) throw error;

        return NextResponse.json({ success: true, bucket: data });
      }
    }

    // Upload file
    if (contentType?.includes('multipart/form-data')) {
      const formData = await req.formData();
      const file = formData.get('file') as File;
      const bucketName = formData.get('bucket') as string;

      if (!file || !bucketName) {
        return NextResponse.json(
          { error: 'Missing file or bucket' },
          { status: 400 }
        );
      }

      const fileName = `${Date.now()}_${file.name}`;
      const filePath = fileName;

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from(bucketName)
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from(bucketName)
        .getPublicUrl(filePath);

      // Save metadata to database
      const { data: fileData, error: metaError } = await supabase
        .from('files')
        .insert({
          file_name: file.name,
          file_size: file.size,
          file_type: file.type,
          file_path: urlData.publicUrl,
          storage_path: `${bucketName}/${filePath}`,
          bucket_id: bucketName,
        })
        .select()
        .single();

      if (metaError) throw metaError;

      return NextResponse.json({ success: true, file: fileData });
    }

    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  } catch (error) {
    console.error('POST Error:', error);
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    );
  }
}

// DELETE - Delete file atau delete bucket
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const action = searchParams.get('action');
    const bucket = searchParams.get('bucket');
    const id = searchParams.get('id');
    const storagePath = searchParams.get('storage_path');

    // Delete bucket
    if (action === 'delete-bucket' && bucket) {
      // Delete all files in bucket from database
      await supabase.from('files').delete().eq('bucket_id', bucket);

      // Empty bucket first
      const { data: filesList } = await supabase.storage.from(bucket).list();
      if (filesList && filesList.length > 0) {
        const filePaths = filesList.map(f => f.name);
        await supabase.storage.from(bucket).remove(filePaths);
      }

      // Delete bucket
      const { error } = await supabase.storage.deleteBucket(bucket);
      if (error) throw error;

      return NextResponse.json({ success: true });
    }

    // Delete file
    if (id && storagePath) {
      // Extract bucket and path
      const [bucketName, ...pathParts] = storagePath.split('/');
      const filePath = pathParts.join('/');

      // Delete from storage
      if (bucketName && filePath) {
        await supabase.storage.from(bucketName).remove([filePath]);
      }

      // Delete from database
      const { error } = await supabase.from('files').delete().eq('id', id);
      if (error) throw error;

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  } catch (error) {
    console.error('DELETE Error:', error);
    return NextResponse.json(
      { error: 'Failed to delete' },
      { status: 500 }
    );
  }
}