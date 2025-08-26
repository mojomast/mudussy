declare function RoomEditModal({ room, isOpen, onClose, onSave, user }: {
    room: any;
    isOpen: any;
    onClose: any;
    onSave: any;
    user: any;
}): any;
declare function EntityManagementModal({ room, isOpen, onClose, onAction, user }: {
    room: any;
    isOpen: any;
    onClose: any;
    onAction: any;
    user: any;
}): any;
declare function WorldMap({ rooms, selectedRoom, onRoomSelect, connections, onRoomEdit, onEntityManage, user }: {
    rooms: any;
    selectedRoom: any;
    onRoomSelect: any;
    connections: any;
    onRoomEdit: any;
    onEntityManage: any;
    user: any;
}): any;
declare function RoomDetailPanel({ room, npcs, items, onClose }: {
    room: any;
    npcs: any;
    items: any;
    onClose: any;
}): any;
declare function SearchAndFilter({ onSearch, onFilter }: {
    onSearch: any;
    onFilter: any;
}): any;
declare function NPCLocationTracker({ npcs, rooms, selectedNpc, onNpcSelect }: {
    npcs: any;
    rooms: any;
    selectedNpc: any;
    onNpcSelect: any;
}): any;
declare function ItemDistribution({ items, rooms, onItemSelect }: {
    items: any;
    rooms: any;
    onItemSelect: any;
}): any;
declare function AccessibilityPanel({ isOpen, onClose, user }: {
    isOpen: any;
    onClose: any;
    user: any;
}): any;
declare function WorldVisualization({ api, user }: {
    api: any;
    user: any;
}): any;
