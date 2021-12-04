import { format } from 'date-fns';
import BRAZIL from 'date-fns/locale/pt-BR';
import { RichText } from 'prismic-dom';

type PostType = {
  first_publication_date: string | null;
  last_publication_date: string | null;
  data: {
    title: string;
    banner: {
      url: string;
    };
    author: string;
    content: {
      heading: string;
      body: {
        text: string;
      }[];
    }[];
  };
};

export function PostFormatter(rawPost: PostType): PostType {
  const publishedIn = rawPost.first_publication_date
    ? format(new Date(rawPost.first_publication_date), 'dd MMM yyyy', {
        locale: BRAZIL,
      })
    : null;

  const editedOn = rawPost.last_publication_date
    ? format(
        new Date(rawPost.last_publication_date),
        "dd MMM yyyy', às' hh:mm",
        {
          locale: BRAZIL,
        }
      )
    : null;

  const contentFormatted = rawPost.data.content.map(content => ({
    heading: content.heading,
    body: [{ text: RichText.asHtml(content.body) }],
  }));

  return {
    first_publication_date: publishedIn,
    last_publication_date: editedOn,
    data: {
      ...rawPost.data,
      content: contentFormatted,
    },
  };
}
