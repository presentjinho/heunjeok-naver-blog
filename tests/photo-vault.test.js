const test=require('node:test');const assert=require('node:assert/strict');const {validatePhotoMeta}=require('../photo-vault');
test('사진 취재함은 이미지 형식과 15MB 제한을 적용한다',()=>{assert.equal(validatePhotoMeta({type:'text/html',size:10}).ok,false);assert.equal(validatePhotoMeta({type:'image/jpeg',size:16*1024*1024}).ok,false);assert.deepEqual(validatePhotoMeta({type:'image/webp',size:1024}),{ok:true})});
