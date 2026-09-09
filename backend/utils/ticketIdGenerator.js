import SupportTicket from '../models/SupportTicket.js';

export const generateTicketId = async () => {
  try {
    const lastTicket = await SupportTicket.findOne().sort({ createdAt: -1 });
    if (!lastTicket || !lastTicket.ticketId) {
      return 'TKT-1001';
    }
    const lastNumStr = lastTicket.ticketId.replace('TKT-', '');
    const lastNum = parseInt(lastNumStr, 10);
    if (isNaN(lastNum)) {
      return 'TKT-1001';
    }
    return `TKT-${lastNum + 1}`;
  } catch (error) {
    console.error('Error generating ticket ID:', error);
    return `TKT-${Math.floor(1000 + Math.random() * 9000)}`;
  }
};
