import createPost from './createPost';
import listPost from './listPost';
import Post from './Post';

type AppSyncEvent = {
  info: {
    fieldName: string
  },
  arguments: {
    post: Post
  }
}

exports.handler = async (event:AppSyncEvent) => {
  switch (event.info.fieldName) {
    case "createPost":
      return await createPost(event.arguments.post);
    case "listPosts":
      return await listPost();
    default:
      return null;
  }
}