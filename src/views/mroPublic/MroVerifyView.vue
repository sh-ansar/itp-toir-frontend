<script setup lang="ts">
import { ref } from 'vue'
import { TextInput, Button } from '@itpmining/vue-basic-components'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import api from '../../api/mroCommercialAdapter'
import { useSessionStore } from '../../stores/session'
import PublicSiteHeader from '../../components/public/PublicSiteHeader.vue'
import PublicSiteFooter from '../../components/public/PublicSiteFooter.vue'
const {t}=useI18n()
const route=useRoute(),router=useRouter(),session=useSessionStore()
const logo=import.meta.env.BASE_URL+'brand/toir-gear.svg'
const token=typeof route.query.token==='string'?route.query.token:''
const password=ref(''),confirmation=ref(''),busy=ref(false),error=ref('')
async function verify(){
 if(busy.value) return
 if(password.value!==confirmation.value){error.value=t('mroPublic.passwordMismatch');return}
 busy.value=true;error.value=''
 try{
  await api.post('/public/register/verify',{token,password:password.value,password_confirmation:confirmation.value})
  password.value='';confirmation.value=''
  await session.refresh()
  await router.replace('/dashboard')
 }catch(e){error.value=e instanceof Error?e.message:t('mroPublic.failed')}
 finally{busy.value=false}
}
</script>
<template>
<div class="mro-public-page"><PublicSiteHeader/>
 <main class="mro-form-wrap">
  <div class="mro-card">
   <img :src="logo" alt="" width="54" height="54"/>
   <h1>{{t('mroPublic.verifyTitle')}}</h1>
   <p>{{t('mroPublic.verifyHint')}}</p>
   <form v-if="token" @submit.prevent="verify">
    <label>{{t('mroPublic.password')}}<TextInput v-model="password" type="password" autocomplete="new-password" minlength="12" required/></label>
    <label>{{t('mroPublic.confirmPassword')}}<TextInput v-model="confirmation" type="password" autocomplete="new-password" minlength="12" required/></label>
    <p v-if="error" role="alert" class="error">{{error}}</p>
    <Button color="primary" block :disabled="busy" type="submit" :text="busy?t('adminPortal.loading'):t('mroPublic.complete')" />
   </form>
   <p v-else role="alert" class="error">{{t('mroPublic.invalidLink')}}</p>
   <RouterLink to="/register">{{t('mroPublic.startAgain')}}</RouterLink>
  </div>
 </main><PublicSiteFooter/>
</div>
</template>
<style scoped>
.mro-public-page{min-height:100dvh;background:#f5f9fa;display:flex;flex-direction:column;color:#173441}
.mro-form-wrap{flex:1;display:grid;place-items:center;padding:48px 16px}
.mro-card{width:100%;max-width:460px;box-sizing:border-box;background:#fff;border:1px solid #dfe9ee;border-radius:14px;padding:40px;box-shadow:0 18px 38px #123b4d12}
.mro-card h1{font-size:27px;letter-spacing:-.035em;margin:22px 0 14px}
.mro-card>p{line-height:1.6;color:#68818c}
.mro-card form{display:grid;gap:18px}
.mro-card label{display:grid;gap:8px;font-size:14px}
.mro-card input{padding:12px;border:1px solid #cbdce6;border-radius:7px;font:inherit}
.mro-card button{padding:12px;border:0;background:#078fd1;color:#fff;border-radius:8px;cursor:pointer}
.mro-card button:disabled{opacity:.5}.error{color:#a0323a}.mro-card a{display:inline-block;margin-top:24px;color:#078fd1}
@media(max-width:480px){.mro-card{padding:26px 20px}}
</style>
