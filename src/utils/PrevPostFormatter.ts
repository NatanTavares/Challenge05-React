import { format } from 'date-fns';
import BRAZIL from 'date-fns/locale/pt-BR';

type PrevPostType = {
  uid?: string;
  first_publication_date: string | null;
  data: {
    title: string;
    subtitle: string;
    author: string;
  };
};

export function prevPostFormatter(rawPost): PrevPostType {
  const date = format(new Date(rawPost.first_publication_date), 'dd MMM yyyy', {
    locale: BRAZIL,
  });

  return {
    uid: rawPost.uid,
    first_publication_date: date,
    data: {
      title: rawPost.data.title || rawPost.data.title1,
      subtitle: rawPost.data.subtitle || rawPost.data.subtitle1,
      author: rawPost.data.author,
    },
  };
}
