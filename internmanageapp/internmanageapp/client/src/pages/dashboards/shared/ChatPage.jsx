    import React from 'react';
    import { useParams } from 'react-router-dom';
    import ProjectChat from '../../../components/chat/ProjectChat'; // We will create this next

    const ChatPage = () => {
        const { projectAssignmentId } = useParams(); // Get the ID from the URL

        if (!projectAssignmentId) {
            return <div className="p-6">Error: Project Assignment ID is missing.</div>;
        }

        return (
            <div className="container mx-auto p-4" style={{ maxWidth: '1200px' }}>
                <ProjectChat projectAssignmentId={projectAssignmentId} />
            </div>
        );
    };

    export default ChatPage;
    