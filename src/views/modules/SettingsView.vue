<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { ShieldCheck, Building2, Users, UserPlus, RefreshCw, Send, Save } from 'lucide-vue-next'
import BasePageHeading from '../../components/ui/BasePageHeading.vue'
import BaseCard from '../../components/ui/BaseCard.vue'
import BaseButton from '../../components/ui/BaseButton.vue'
import BaseNotice from '../../components/ui/BaseNotice.vue'
import { useSessionStore } from '../../stores/session'
import { usePreviewStore } from '../../stores/preview'
import { listCompanyMembers, getCompanyMailStatus, inviteCompanyMember, changeCompanyMember, resendCompanyInvite,
  type CompanyMember, type MemberRole } from '../../api/members'

const session=useSessionStore()
const preview=usePreviewStore()
const company=computed(()=>session.session?.companies.find(x=>x.id===session.session?.active_company_id))
const canManage=computed(()=>['owner','admin'].includes(session.session?.active_role||''))
const isOwner=computed(()=>session.session?.active_role==='owner')
const members=ref<CompanyMember[]>([])
const mailEnabled=ref(false)
const loading=ref(false)
const saving=ref<number|null>(null)
const error=ref('')
const notice=ref('')
const showInvite=ref(false)
const inviteName=ref('')
const inviteEmail=ref('')
const inviteRole=ref<MemberRole>('viewer')
const roleLabels:Record<MemberRole,string>={
 owner:'Владелец',admin:'Администратор',manager:'Руководитель',
 engineer:'Инженер',technician:'Техник',viewer:'Наблюдатель',
}
const availableRoles=computed<MemberRole[]>(()=>isOwner.value?
 ['owner','admin','manager','engineer','technician','viewer']:
 ['admin','manager','engineer','technician','viewer'])
async function refresh(){
 if(!canManage.value||preview.enabled){members.value=[];mailEnabled.value=false;return}
 loading.value=true;error.value=''
 try{
   const [rows,mail]=await Promise.all([listCompanyMembers(),getCompanyMailStatus()])
   members.value=rows;mailEnabled.value=mail.delivery_enabled
 }
 catch(e){error.value=e instanceof Error?e.message:'Не удалось загрузить участников'}
 finally{loading.value=false}
}
async function invite(){
 if(preview.enabled||!mailEnabled.value||saving.value!==null)return
 saving.value=0;error.value='';notice.value=''
 try{
  const result=await inviteCompanyMember({name:inviteName.value.trim(),email:inviteEmail.value.trim(),role:inviteRole.value})
  showInvite.value=false;inviteName.value='';inviteEmail.value='';inviteRole.value='viewer'
  notice.value=result.message || (result.email_sent
    ? 'Участник добавлен. Ссылка активации отправлена.'
    : 'Доступ участнику предоставлен.')
  await refresh()
 }catch(e){error.value=e instanceof Error?e.message:'Не удалось пригласить участника'}
 finally{saving.value=null}
}
async function update(member:CompanyMember,role:MemberRole,active:boolean){
 if(preview.enabled||saving.value!==null)return
 if(member.id===session.session?.user.id&&!active){error.value='Собственное членство нельзя отключить.';return}
 saving.value=member.id;error.value='';notice.value=''
 try{
  await changeCompanyMember(member.id,{role,membership_active:active})
  notice.value='Права участника сохранены.'
  await refresh()
  if(member.id===session.session?.user.id)await session.refresh()
 }catch(e){error.value=e instanceof Error?e.message:'Не удалось изменить права';await refresh()}
 finally{saving.value=null}
}
async function resend(member:CompanyMember){
 if(preview.enabled||!mailEnabled.value||saving.value!==null)return
 saving.value=member.id;error.value='';notice.value=''
 try{await resendCompanyInvite(member.id);notice.value='Письмо активации повторно отправлено.'}
 catch(e){error.value=e instanceof Error?e.message:'Не удалось отправить приглашение'}
 finally{saving.value=null}
}
watch(()=>[session.session?.active_company_id,session.session?.active_role,preview.enabled],()=>void refresh())
onMounted(()=>void refresh())
</script>

<template>
  <div class="settings-page">
    <BasePageHeading title="Конфигурация" />
    <BaseNotice v-if="error" tone="error">{{ error }}</BaseNotice>
    <BaseNotice v-if="notice" tone="success">{{ notice }}</BaseNotice>
    <div class="settings-grid">
      <BaseCard>
        <div class="card-section-heading"><Building2 :size="19"/><h2>Компания</h2></div>
        <dl class="detail-dl">
          <dt>Название</dt><dd>{{ company?.name||'—' }}</dd>
          <dt>Код</dt><dd>{{ company?.code||'—' }}</dd>
          <dt>Моя роль</dt><dd>{{ company?.role?roleLabels[company.role]:'—' }}</dd>
        </dl>
      </BaseCard>
      <BaseCard>
        <div class="card-section-heading"><ShieldCheck :size="19"/><h2>Контроль доступа</h2></div>
        <p class="muted">Права действуют в пределах выбранной компании.</p>
        <RouterLink class="blank-link" to="/profile">Мой профиль и пароль</RouterLink>
      </BaseCard>
    </div>
    <section v-if="canManage" class="members-section">
      <div class="members-heading">
        <div><h2><Users :size="20"/> Пользователи и роли</h2></div>
        <div class="members-actions">
          <button class="toolbar-icon" type="button" aria-label="Обновить участников" :disabled="loading" @click="refresh"><RefreshCw :size="17"/></button>
          <BaseButton type="button" :disabled="preview.enabled||!mailEnabled" @click="showInvite=true;error=''"><UserPlus :size="16"/>Пригласить</BaseButton>
        </div>
      </div>
      <BaseNotice v-if="!loading&&!mailEnabled" tone="warning">Почтовая отправка не настроена. Приглашения и повторная отправка писем недоступны, пока администратор сервера не подключит SMTP.</BaseNotice>
      <div class="toir-table-scroll">
        <table class="toir-table members-table">
          <thead><tr><th>Сотрудник</th><th>Email</th><th>Роль</th><th>Статус</th><th>Действия</th></tr></thead>
          <tbody>
            <tr v-for="member in members" :key="member.id">
              <td><strong>{{ member.name }}</strong></td>
              <td>{{ member.email }}</td>
              <td><select :value="member.role" :aria-label="'Роль '+member.name"
                :disabled="saving!==null||preview.enabled||(!isOwner&&member.role==='owner')"
                @change="update(member,($event.target as HTMLSelectElement).value as MemberRole,member.membership_active)">
                <option v-for="role in (member.role==='owner'&&!isOwner?(['owner'] as MemberRole[]):availableRoles)" :key="role" :value="role">{{ roleLabels[role] }}</option>
              </select></td>
              <td>{{ !member.account_active?'Учётная запись отключена':!member.membership_active?'Доступ отключён':!member.email_verified?'Ожидает подтверждения':'Активен' }}</td>
              <td><div class="members-actions">
                <button type="button" class="toolbar-icon" :disabled="saving!==null||preview.enabled||!member.account_active||(!isOwner&&member.role==='owner')"
                  :title="!member.account_active?'Учётная запись отключена на уровне системы':member.membership_active?'Отключить доступ':'Включить доступ'"
                  :aria-label="(member.membership_active?'Отключить ':'Включить ')+member.name"
                  @click="update(member,member.role,!member.membership_active)">
                  <ShieldCheck :size="17"/>
                </button>
                <button v-if="member.account_active&&!member.email_verified&&member.membership_active" type="button" class="toolbar-icon"
                  :disabled="saving!==null||preview.enabled||!mailEnabled" :title="'Отправить приглашение '+member.name"
                  :aria-label="'Повторить приглашение '+member.name" @click="resend(member)"><Send :size="17"/></button>
              </div></td>
            </tr>
            <tr v-if="!members.length"><td colspan="5">{{ loading?'Загрузка участников…':'Нет участников для отображения.' }}</td></tr>
          </tbody>
        </table>
      </div>
    </section>
    <Teleport to="body">
      <div v-if="showInvite" class="category-backdrop" @click.self="saving===null&&(showInvite=false)">
        <section class="category-dialog workflow-dialog" role="dialog" aria-modal="true" aria-label="Пригласить пользователя">
          <header class="category-dialog-head"><div class="category-dialog-icon"><UserPlus :size="19"/></div>
            <button type="button" class="drawer-close" aria-label="Закрыть" :disabled="saving!==null" @click="showInvite=false">×</button></header>
          <h2>Пригласить пользователя</h2>
          <p>Новый пользователь получит одноразовую ссылку для установки пароля. Действующим пользователям назначается доступ к этой компании.</p>
          <form class="workflow-form" @submit.prevent="invite">
            <label>Имя и фамилия *<input v-model="inviteName" minlength="2" maxlength="255" required :disabled="saving!==null"/></label>
            <label>Email *<input v-model="inviteEmail" type="email" maxlength="255" required :disabled="saving!==null"/></label>
            <label>Роль *<select v-model="inviteRole" required :disabled="saving!==null">
              <option v-for="role in availableRoles" :key="role" :value="role">{{ roleLabels[role] }}</option></select></label>
            <div class="category-dialog-footer">
              <BaseButton variant="secondary" type="button" :disabled="saving!==null" @click="showInvite=false">Отмена</BaseButton>
              <BaseButton type="submit" :disabled="saving!==null||preview.enabled||!mailEnabled"><Save :size="16"/>Пригласить</BaseButton>
            </div>
          </form>
        </section>
      </div>
    </Teleport>
  </div>
</template>
