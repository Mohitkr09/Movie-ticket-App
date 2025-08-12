import { Inngest } from "inngest";
import User from "../models/User.js";
import Booking from "../models/Booking.js";
import Show from "../models/Show.js";
import sendEmail from "../configs/nodeMailer.js"
export const inngest = new Inngest({ id: "movie-ticket-booking" });

const syncUserCreation = inngest.createFunction(
  { id: "sync-user-from-clerk" },
  { event: "clerk/user.created" },
  async ({ event }) => {
    try {
      const { id, first_name, last_name, email_addresses, image_url } = event.data;
      const userData = {
        _id: id,
        email: email_addresses?.[0]?.email_address || '',
        name: `${first_name || ''} ${last_name || ''}`.trim(),
        image: image_url || ''
      };
      await User.create(userData);
    } catch (error) {
      console.error("Error creating user:", error);
    }
  }
);

const syncUserDeletion = inngest.createFunction(
  { id: "delete-user-from-clerk" },
  { event: "clerk/user.deleted" },
  async ({ event }) => {
    try {
      const { id } = event.data;
      await User.findByIdAndDelete(id);
    } catch (error) {
      console.error("Error deleting user:", error);
    }
  }
);

const syncUserUpdation = inngest.createFunction(
  { id: "update-user-from-clerk" },
  { event: "clerk/user.updated" },
  async ({ event }) => {
    try {
      const { id, first_name, last_name, email_addresses, image_url } = event.data;
      const updatedData = {
        email: email_addresses?.[0]?.email_address || '',
        name: `${first_name || ''} ${last_name || ''}`.trim(),
        image: image_url || ''
      };
      await User.findByIdAndUpdate(id, updatedData, { new: true, runValidators: true });
    } catch (error) {
      console.error("Error updating user:", error);
    }
  }
)

const releaseSeatsAndDeleteBooking = inngest.createFunction(
  {id:'release-seats-delete-booking'},
  {event: "app/checkpayment"},
  async({event, step})=>{
    const tenMinutesLater = new Date(Date.now()+10*60*1000);
    await step.sleepUntil('wait-for-10-minutes', 
      tenMinutesLater
    );
    await step.run('check-payment-status',async()=>{
      const bookingId = event.data.bookingId;
      const booking =await Booking.findById(bookingId)

      if(!booking.isPaid){
        const show = await Show.findById(booking.show);
        booking.bookedSeats.forEach((seat)=>{
          delete show.occupiedSeats[seat]
        });
        show.markModified('occupiedSeats')
        await show.save()
        await Booking.findByIdAndDelete(booking._id)
      }
    })
  }
)

const sendBookingConfirmationEmail = inngest.createFunction(
  {id:"send-booking-confirmation-email"},
  {event:"app/show.booked"},
  async({event,step})=>{
    const {bookingId} = event.data;

    const booking = await Booking.findById(bookingId).populate({
      path:'show',
      populate:{path: "movie",model: "Movie"}
    }).populate('user');

    await sendEmail({
  to: booking.user.email,
  subject: `🎟 Payment Confirmation: "${booking.show.movie.title}" Booked!`,
  body: `
  <div style="font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 20px;">
    <div style="max-width: 600px; background-color: white; margin: auto; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 8px rgba(0,0,0,0.1);">
      
      <div style="background-color: #F84565; padding: 15px; text-align: center; color: white;">
        <h1 style="margin: 0; font-size: 24px;">🎬 QuickShow</h1>
        <p style="margin: 0; font-size: 16px;">Your Movie Ticket is Confirmed!</p>
      </div>

      <div style="padding: 20px; color: #333;">
        <h2 style="color: #F84565;">Hi ${booking.user.name},</h2>
        <p>Your booking for <strong>"${booking.show.movie.title}"</strong> is confirmed.</p>
        
        <div style="background-color: #fdf2f3; padding: 15px; border-left: 4px solid #F84565; margin: 20px 0; border-radius: 5px;">
          <p style="margin: 0; font-size: 16px;">
            <strong>Date:</strong> ${new Date(booking.show.showDateTime).toLocaleDateString('en-us', { timeZone: 'Asia/Kolkata' })}<br/>
            <strong>Time:</strong> ${new Date(booking.show.showDateTime).toLocaleTimeString('en-us', { timeZone: 'Asia/Kolkata' })}
          </p>
        </div>

        <p style="margin: 0;">Enjoy the show! 🍿</p>
        <p style="margin-top: 10px;">Thanks for booking with us!<br/>- <strong>QuickShow Team</strong></p>
      </div>

      <div style="background-color: #f9f9f9; padding: 10px; text-align: center; font-size: 12px; color: #888;">
        <p style="margin: 0;">This is an automated confirmation. Please do not reply.</p>
      </div>
    </div>
  </div>
  `
});

  }
)


const sendShowReminders = inngest.createFunction(
  {id:"send-show-remainders"},
  {cron: "0 */8 * * *"},
  async({step}) =>{
    const now = new Date();
    const in8Hours = new Date(now.getTime()+8*60*60*1000);
    const windowStart = new Date(in8Hours.getTime()-10*60*1000);

    const remainderTasks = await step.run("prepare-remainder-tasks",async()=>{
      const shows = await Show.find({
        showTime:{$gte: windowStart,$lte: in8Hours},
      }).populate('movie');

      const tasks =[];

      for(const show of shows){
        if(!show.movie || !show.occupiedSeats) continue;

        const userIds =[...new Set(Object.values(show.occupiedSeats))];
        if(userIds.length === 0) continue;

        const users = await User.find({_id: {$in: userIds}}).select("name email");

        for(const user of users){
          tasks.push({
            userEmail: user.email,
            userName: user.name,
            movieTitle: show.movie.title,
            showTime: show.showTime,
          })
        }
      }
      return tasks;
    })
    if(remainderTasks.length === 0){
      return { sent: 0, message: "No remainders to send."}
    }

    const results = await step.run('send-all-remainders',async()=>{
      return await Promise.allSettled(
        remainderTasks.map(task => sendEmail({
          to: task.userEmail,
          subject:`Remainder: Your movie "${task.movieTitle}" starts
          soon!`,
          body:`< style="font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 20px;">
    <h2>Hello ${task.userName},</h2>
    <p>This is a quick remainder that your movie:</p>
    <h3 style="color: #F84565;">"${task.movieTitle}"</h3>
    <p> is scheduled for <strong>${new Date(task.showTime).toLocaleDateString('en-Us',{timeZone:'Asia/Kolkata'})}</strong> at 
    <strong>${new Date(task.showTime).toLocaleTimeString ('en-US',{timeZone:'Asia/Kolkata'})}</strong>.
    </p>
    <p>It starts in approximately <strong>8 hours</strong>
    - make sure you're ready!</p>
    <br/>
    <p> Enjoy the show!<br/> QuickShow Team</p>    
  </div>`
        }))
      )
    })

    const sent =results.filter(r=>r.status === "fulfilled").length;
    const failed = results.length -sent;

    return {
      sent,
      failed,
      message:`Sent ${sent} remainder(s),${failed} failed.`
    }
  }
)

const sendNewShowNotifications = inngest.createFunction(
  {id:"send-new-show-notifications"},
  {event:'app/show.added'},
  async({event})=>{
    const {movieTitle} = event.data;
    const users =await User.find({})

    for(const user of users){
      const userEmail = user.email;
      const userName = user.name;

      const subject =`New Show Added:${movieTitle}`;
      const body =`<div style="font -family:Arial,sans-serif;padding: 20px;">
      <h2> Hi ${userName},</h2>
      <p>We've just added a new show to our library:</p>
      <h3 style="color: #F84565;">"${movieTitle}"</h3>
      <p> Visit our website</p>
      <br/>
      <p>Thanks,<br/> QuickShow Team</p>
      </div>`;

       await sendEmail({
      to:userEmail,
      subject,
      body,
    })

    }
    return {message:"Notifications sent."}
   
  }
)
export const functions = [syncUserCreation, syncUserDeletion, syncUserUpdation,releaseSeatsAndDeleteBooking,sendBookingConfirmationEmail,sendShowReminders,sendNewShowNotifications];
