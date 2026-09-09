import { sendEmail } from './emailService.js';

export const sendTicketNotificationEmail = async (ticket, customer, actionType) => {
  let subject = '';
  let html = '';

  switch (actionType) {
    case 'created':
      subject = `Support Ticket Created - ${ticket.ticketId}`;
      html = `
        <h2>Dear ${customer.name},</h2>
        <p>Your support ticket has been successfully created.</p>
        <p><strong>Ticket ID:</strong> ${ticket.ticketId}</p>
        <p><strong>Subject:</strong> ${ticket.subject}</p>
        <p><strong>Category:</strong> ${ticket.category}</p>
        <p><strong>Priority:</strong> ${ticket.priority}</p>
        <p><strong>Details:</strong> ${ticket.description}</p>
        <br/>
        <p>Our support team will review it and get back to you shortly.</p>
        <p>Best regards,<br/>Urban Tadka Support Team</p>
      `;
      break;
    case 'replied':
      subject = `Support Ticket Reply - ${ticket.ticketId}`;
      html = `
        <h2>Dear ${customer.name},</h2>
        <p>Our support team has replied to your ticket <strong>${ticket.ticketId}</strong>.</p>
        <p><strong>Subject:</strong> ${ticket.subject}</p>
        <p><strong>Latest Update:</strong> ${ticket.messages[ticket.messages.length - 1].message}</p>
        <br/>
        <p>Please log in to your dashboard to view the complete conversation and reply.</p>
        <p>Best regards,<br/>Urban Tadka Support Team</p>
      `;
      break;
    case 'closed':
      subject = `Support Ticket Closed - ${ticket.ticketId}`;
      html = `
        <h2>Dear ${customer.name},</h2>
        <p>Your support ticket <strong>${ticket.ticketId}</strong> has been marked as <strong>Closed</strong>.</p>
        <p><strong>Subject:</strong> ${ticket.subject}</p>
        <br/>
        <p>If you have any further questions, you can reopen the ticket or submit a new support request.</p>
        <p>Best regards,<br/>Urban Tadka Support Team</p>
      `;
      break;
    case 'reopened':
      subject = `Support Ticket Reopened - ${ticket.ticketId}`;
      html = `
        <h2>Dear ${customer.name},</h2>
        <p>Your support ticket <strong>${ticket.ticketId}</strong> has been reopened.</p>
        <p><strong>Subject:</strong> ${ticket.subject}</p>
        <br/>
        <p>Our support team will look into it again and notify you of any updates.</p>
        <p>Best regards,<br/>Urban Tadka Support Team</p>
      `;
      break;
    default:
      return;
  }

  await sendEmail(customer.email, subject, html);
};
