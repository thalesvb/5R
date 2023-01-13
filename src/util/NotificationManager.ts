import Object from "sap/ui/base/Object";
import Message from "sap/ui/core/message/Message";
import MessageManager from "sap/ui/core/message/MessageManager";
import MessageModel from "sap/ui/model/message/MessageModel";

/**
 * @copyright ${copyright}
 * @namespace thalesvb.5R.util
 */
export default class NotificationManager extends Object {
    private static instance: NotificationManager;
    private manager: MessageManager;

    private constructor() {
        super();
        this.manager = new MessageManager();
    }

    static getInstance(): NotificationManager {
        if (!this.instance) {
            this.instance = new NotificationManager();
        }
        return this.instance;
    }
    
    getMessageModel(): MessageModel {
        return this.manager.getMessageModel();
    }

    addNotifications(...notifications: Message[]): void {
        this.manager.addMessages(notifications);
    }
    dismissNotifications(...notifications: Message[]): void {
        this.manager.removeMessages(notifications);
    }
    dismissAllNotifications(): void {
        this.manager.removeAllMessages();
    }
}
