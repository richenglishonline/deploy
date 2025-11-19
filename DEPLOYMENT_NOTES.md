# Hostinger Deployment Notes

## Important: npm is NOT available on the server

Since npm is not available on Hostinger SSH, all frontend assets must be built locally and committed to the repository.

### Building Assets Locally

Before deploying, run:
```bash
npm install
npm run build
```

Then commit the `public/build` directory to the repository.

## Storage Link Issue

The `php artisan storage:link` command fails because `exec()` is disabled on Hostinger.

### Solution: Create Storage Link Manually

After deployment, run this command via SSH:

```bash
cd ~/domains/richenglishedu.com/public_html
chmod +x create-storage-link.sh
./create-storage-link.sh
```

Or manually:
```bash
cd ~/domains/richenglishedu.com/public_html
ln -s ../storage/app/public public/storage
```

### Verify Storage Link

```bash
ls -la public/storage
```

Should show: `storage -> ../storage/app/public`

## Post-Deployment Checklist

1. ✅ Build assets locally and commit `public/build`
2. ✅ Push to GitHub
3. ✅ Let Hostinger auto-deploy from Git
4. ✅ SSH into server and run `create-storage-link.sh`
5. ✅ Run `php artisan config:clear`
6. ✅ Run `php artisan route:clear`
7. ✅ Run `php artisan view:clear` (should work now with .gitkeep files)
8. ✅ Verify website is accessible

## Alternative: If Symlinks Don't Work

If symlinks are completely disabled, you can modify `config/filesystems.php`:

```php
'public' => [
    'driver' => 'local',
    'root' => public_path('storage'),
    'url' => env('APP_URL').'/storage',
    'visibility' => 'public',
],
```

Then copy files:
```bash
cp -r storage/app/public/* public/storage/
```

