import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { event_type, user_id, data } = await req.json()

    console.log(`Processing notification event: ${event_type} for user ${user_id}`)

    // Get user's notification preferences
    const { data: preferences } = await supabase
      .from('notification_preferences')
      .select('*')
      .eq('user_id', user_id)
      .single()

    const results = []

    // Email notifications
    if (preferences?.email_enabled) {
      try {
        const emailResult = await sendEmailNotification(event_type, user_id, data)
        results.push({ channel: 'email', status: 'success', ...emailResult })
      } catch (error) {
        results.push({ channel: 'email', status: 'failed', error: error.message })
      }
    }

    // SMS notifications  
    if (preferences?.sms_enabled && preferences?.phone_number) {
      try {
        const smsResult = await sendSMSNotification(event_type, preferences.phone_number, data)
        results.push({ channel: 'sms', status: 'success', ...smsResult })
      } catch (error) {
        results.push({ channel: 'sms', status: 'failed', error: error.message })
      }
    }

    // Discord notifications
    if (preferences?.discord_webhook_url) {
      try {
        const discordResult = await sendDiscordNotification(event_type, preferences.discord_webhook_url, data)
        results.push({ channel: 'discord', status: 'success', ...discordResult })
      } catch (error) {
        results.push({ channel: 'discord', status: 'failed', error: error.message })
      }
    }

    // Slack notifications
    if (preferences?.slack_webhook_url) {
      try {
        const slackResult = await sendSlackNotification(event_type, preferences.slack_webhook_url, data)
        results.push({ channel: 'slack', status: 'success', ...slackResult })
      } catch (error) {
        results.push({ channel: 'slack', status: 'failed', error: error.message })
      }
    }

    // Push notifications (browser/mobile)
    if (preferences?.push_enabled) {
      try {
        const pushResult = await sendPushNotification(event_type, user_id, data)
        results.push({ channel: 'push', status: 'success', ...pushResult })
      } catch (error) {
        results.push({ channel: 'push', status: 'failed', error: error.message })
      }
    }

    return new Response(JSON.stringify({
      success: true,
      event_type,
      notifications_sent: results.length,
      results
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Notification dispatcher error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})

async function sendEmailNotification(eventType: string, userId: string, data: any) {
  const templates = {
    xp_achievement: {
      subject: '🎉 Achievement Unlocked!',
      html: `
        <h1>Congratulations!</h1>
        <p>You've earned <strong>${data.xp_amount} XP</strong> for ${data.achievement_name}!</p>
        <p>Your total XP: ${data.total_xp}</p>
        <a href="${data.dashboard_url}" style="background: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">View Dashboard</a>
      `
    },
    campaign_completed: {
      subject: '✅ Campaign Completed!',
      html: `
        <h1>Campaign Success!</h1>
        <p>Your campaign "<strong>${data.campaign_name}</strong>" has been completed!</p>
        <p>Results: ${data.results}</p>
        <a href="${data.campaign_url}">View Campaign Details</a>
      `
    },
    new_campaign_created: {
      subject: '🚀 New Campaign Alert!',
      html: `
        <h1>New Campaign Available!</h1>
        <p>A new campaign "<strong>${data.campaign_name}</strong>" is now available!</p>
        <p>Reward: ${data.reward}</p>
        <a href="${data.campaign_url}">Join Campaign</a>
      `
    }
  }

  const template = templates[eventType as keyof typeof templates]
  if (!template) {
    throw new Error(`No email template found for event: ${eventType}`)
  }

  // Using Resend (you'll need to add RESEND_API_KEY to secrets)
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${Deno.env.get('RESEND_API_KEY')}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: `StreamCentives <${Deno.env.get('SENDER_EMAIL') || 'noreply@streamcentives.com'}>`,
      to: [data.user_email],
      subject: template.subject,
      html: template.html,
    }),
  })

  const result = await response.json()
  return { message_id: result.id }
}

async function sendSMSNotification(eventType: string, phoneNumber: string, data: any) {
  const templates = {
    xp_achievement: `🎉 Achievement Unlocked! You earned ${data.xp_amount} XP for ${data.achievement_name}! Total XP: ${data.total_xp}`,
    campaign_completed: `✅ Campaign "${data.campaign_name}" completed! Check your results at ${data.campaign_url}`,
    new_campaign_created: `🚀 New campaign available: "${data.campaign_name}" with reward: ${data.reward}. Join now!`
  }

  const message = templates[eventType as keyof typeof templates]
  if (!message) {
    throw new Error(`No SMS template found for event: ${eventType}`)
  }

  // Using Twilio (you'll need to add TWILIO credentials to secrets)
  const accountSid = Deno.env.get('TWILIO_ACCOUNT_SID')
  const authToken = Deno.env.get('TWILIO_AUTH_TOKEN')
  const fromNumber = Deno.env.get('TWILIO_PHONE_NUMBER')

  const response = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${btoa(`${accountSid}:${authToken}`)}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        From: fromNumber!,
        To: phoneNumber,
        Body: message,
      }),
    }
  )

  const result = await response.json()
  return { message_sid: result.sid }
}

async function sendDiscordNotification(eventType: string, webhookUrl: string, data: any) {
  const embeds = {
    xp_achievement: {
      title: '🎉 Achievement Unlocked!',
      description: `**${data.achievement_name}**\nXP Earned: ${data.xp_amount}\nTotal XP: ${data.total_xp}`,
      color: 0x00ff00,
      fields: [
        { name: 'User', value: data.username, inline: true },
        { name: 'XP Earned', value: data.xp_amount.toString(), inline: true }
      ]
    },
    campaign_completed: {
      title: '✅ Campaign Completed!',
      description: `Campaign "${data.campaign_name}" has been completed!`,
      color: 0x0099ff,
    },
    new_campaign_created: {
      title: '🚀 New Campaign Available!',
      description: `"${data.campaign_name}" is now live!\nReward: ${data.reward}`,
      color: 0xff6600,
    }
  }

  const embed = embeds[eventType as keyof typeof embeds]
  if (!embed) {
    throw new Error(`No Discord template found for event: ${eventType}`)
  }

  const response = await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ embeds: [embed] })
  })

  return { status: response.status }
}

async function sendSlackNotification(eventType: string, webhookUrl: string, data: any) {
  const templates = {
    xp_achievement: {
      text: '🎉 Achievement Unlocked!',
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*${data.username}* earned *${data.xp_amount} XP* for *${data.achievement_name}*!\nTotal XP: ${data.total_xp}`
          }
        }
      ]
    },
    campaign_completed: {
      text: '✅ Campaign Completed!',
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `Campaign *${data.campaign_name}* has been completed!\nResults: ${data.results}`
          }
        }
      ]
    },
    new_campaign_created: {
      text: '🚀 New Campaign Available!',
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `New campaign *${data.campaign_name}* is now live!\nReward: ${data.reward}`
          }
        }
      ]
    }
  }

  const template = templates[eventType as keyof typeof templates]
  if (!template) {
    throw new Error(`No Slack template found for event: ${eventType}`)
  }

  const response = await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(template)
  })

  return { status: response.status }
}

async function sendPushNotification(eventType: string, userId: string, data: any) {
  // Implementation for Web Push notifications
  // You would integrate with services like FCM, OneSignal, etc.
  
  const templates = {
    xp_achievement: {
      title: '🎉 Achievement Unlocked!',
      body: `You earned ${data.xp_amount} XP for ${data.achievement_name}!`,
      icon: '/icons/achievement.png'
    },
    campaign_completed: {
      title: '✅ Campaign Completed!',
      body: `Your campaign "${data.campaign_name}" is complete!`,
      icon: '/icons/campaign.png'
    },
    new_campaign_created: {
      title: '🚀 New Campaign Available!',
      body: `"${data.campaign_name}" - Reward: ${data.reward}`,
      icon: '/icons/new-campaign.png'
    }
  }

  const template = templates[eventType as keyof typeof templates]
  if (!template) {
    throw new Error(`No push template found for event: ${eventType}`)
  }

  // Placeholder for push notification service integration
  console.log('Push notification would be sent:', template)
  
  return { notification_id: `push_${Date.now()}` }
}